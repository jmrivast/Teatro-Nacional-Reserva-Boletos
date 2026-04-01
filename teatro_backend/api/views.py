import json
import re
from decimal import Decimal, InvalidOperation

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.http import HttpResponse, JsonResponse, QueryDict
from django.shortcuts import render
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_time
from django.utils.html import strip_tags
from django.utils.text import slugify
from django.views.decorators.http import require_GET, require_http_methods

from .models import Evento, Reserva


MESES = (
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
)
ASIENTO_REGEX = re.compile(r"^[A-F](?:[1-9]|1[0-2])$")
SCRIPT_STYLE_REGEX = re.compile(r"(?is)<(script|style).*?>.*?</\1>")
CONTROL_CHAR_REGEX = re.compile(r"[\x00-\x08\x0B-\x1F\x7F]+")
MULTISPACE_REGEX = re.compile(r"\s+")
HTTP_ALLOW_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
EVENTO_CATEGORIAS = {value: value for value, _ in Evento.Categoria.choices}
EVENTO_CATEGORIAS.update(
    {
        label.lower(): value
        for value, label in Evento.Categoria.choices
    }
)
EVENTO_CATEGORIAS.update(
    {
        slugify(label): value
        for value, label in Evento.Categoria.choices
    }
)
FRONTEND_CONFIG = {
    "venue_name": "Teatro Nacional Eduardo Brito",
    "seat_map": {
        "rows": ["A", "B", "C", "D", "E", "F"],
        "columns": 12,
    },
}
MISSING = object()


def _formatear_fecha(fecha):
    return f"{fecha.day} de {MESES[fecha.month - 1]} de {fecha.year}"


def _formatear_hora(hora):
    return hora.strftime("%I:%M %p").lstrip("0")


def _json_response(payload, status=200):
    response = JsonResponse(payload, status=status)
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Headers"] = (
        "Content-Type, Authorization, X-CSRFToken, X-Requested-With"
    )
    response["Access-Control-Allow-Methods"] = HTTP_ALLOW_METHODS
    return response


def _empty_response(status=204):
    response = HttpResponse(status=status)
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Headers"] = (
        "Content-Type, Authorization, X-CSRFToken, X-Requested-With"
    )
    response["Access-Control-Allow-Methods"] = HTTP_ALLOW_METHODS
    return response


def _limpiar_texto_plano(valor, max_length=None, fallback=""):
    texto = str(valor if valor is not None else fallback)
    texto = SCRIPT_STYLE_REGEX.sub(" ", texto)
    texto = strip_tags(texto)
    texto = CONTROL_CHAR_REGEX.sub(" ", texto)
    texto = MULTISPACE_REGEX.sub(" ", texto).strip()

    if max_length is not None:
        texto = texto[:max_length].strip()

    return texto


def _normalizar_imagen(valor):
    imagen = str(valor or "").strip()
    if not imagen:
        return None

    if imagen.startswith("/") or imagen.lower().startswith(("http://", "https://")):
        return imagen

    return None


def _serializar_evento(evento):
    titulo = _limpiar_texto_plano(evento.titulo, max_length=200, fallback="Evento")
    descripcion = _limpiar_texto_plano(evento.descripcion)
    categoria = _limpiar_texto_plano(evento.get_categoria_display(), max_length=50)
    hora = evento.hora.strftime("%H:%M")
    imagen = _normalizar_imagen(evento.imagen)

    return {
        "id": evento.id,
        "slug": slugify(titulo),
        "titulo": titulo,
        "title": titulo,
        "descripcion": descripcion,
        "description": descripcion,
        "fecha": evento.fecha.isoformat(),
        "date": evento.fecha.isoformat(),
        "date_label": _formatear_fecha(evento.fecha),
        "hora": hora,
        "time": hora,
        "time_label": _formatear_hora(evento.hora),
        "precio": float(evento.precio),
        "price": float(evento.precio),
        "price_label": f"RD$ {evento.precio:,.2f}",
        "imagen": imagen,
        "image": imagen,
        "categoria": categoria,
        "category": categoria,
        "categoria_codigo": evento.categoria,
        "category_code": evento.categoria,
        "publicado": evento.publicado,
        "published": evento.publicado,
    }


def _serializar_reserva(reserva, incluir_usuario=False):
    asientos = [asiento.strip() for asiento in reserva.asientos.split(",") if asiento.strip()]

    payload = {
        "id": reserva.codigo_reserva,
        "codigo_reserva": reserva.codigo_reserva,
        "asientos": asientos,
        "seats": asientos,
        "cantidad_asientos": len(asientos),
        "seat_count": len(asientos),
        "total_pagado": float(reserva.total_pagado),
        "total": float(reserva.total_pagado),
        "estado": reserva.estado,
        "status": reserva.estado,
        "estado_label": reserva.get_estado_display(),
        "fecha_reserva": reserva.fecha_reserva.isoformat(),
        "event": _serializar_evento(reserva.evento),
        "evento": _serializar_evento(reserva.evento),
    }

    if incluir_usuario:
        payload["usuario"] = _serializar_usuario(reserva.usuario)
        payload["user"] = payload["usuario"]

    return payload


def _usuario_es_staff(usuario):
    return bool(
        getattr(usuario, "is_authenticated", False)
        and (usuario.is_staff or usuario.is_superuser)
    )


def _serializar_usuario(usuario):
    username = _limpiar_texto_plano(usuario.get_username(), max_length=150, fallback="usuario")
    nombre = _limpiar_texto_plano(
        usuario.first_name or username,
        max_length=150,
        fallback="Usuario",
    )
    email = _limpiar_texto_plano(usuario.email, max_length=254)
    es_staff = _usuario_es_staff(usuario)
    permisos = ["reservas:crear", "reservas:leer"]

    if es_staff:
        permisos.extend(["eventos:gestionar", "reservas:gestionar"])

    return {
        "id": usuario.id,
        "username": username,
        "email": email,
        "name": nombre,
        "nombre": nombre,
        "role": "admin" if es_staff else "cliente",
        "rol": "admin" if es_staff else "cliente",
        "is_staff": es_staff,
        "permissions": permisos,
        "permisos": permisos,
    }


def _normalizar_asientos(valor):
    if isinstance(valor, list):
        items = valor
    else:
        items = str(valor or "").split(",")

    asientos = []
    vistos = set()

    for item in items:
        asiento = str(item).strip().upper()
        if asiento and asiento not in vistos:
            asientos.append(asiento)
            vistos.add(asiento)

    return asientos


def _extraer_payload(request):
    content_type = request.content_type or ""

    if "application/json" in content_type:
        try:
            return json.loads(request.body.decode("utf-8") or "{}")
        except (json.JSONDecodeError, UnicodeDecodeError):
            return None

    if request.body and request.method in {"PUT", "PATCH", "DELETE"}:
        try:
            return QueryDict(request.body.decode("utf-8")).dict()
        except UnicodeDecodeError:
            return None

    return request.POST.dict()


def _buscar_valor(payload, *keys):
    for key in keys:
        if key in payload:
            return payload[key]
    return MISSING


def _obtener_usuario(nombre, email):
    User = get_user_model()
    nombre_limpio = _limpiar_texto_plano(nombre, max_length=150)
    email_normalizado = _limpiar_texto_plano(email, max_length=254).lower()
    usuario = User.objects.filter(email__iexact=email_normalizado).first()

    if usuario:
        if nombre_limpio and not usuario.first_name:
            usuario.first_name = nombre_limpio[:150]
            usuario.save(update_fields=["first_name"])
        return usuario

    base_username = slugify(email_normalizado.split("@")[0]) or "usuario"
    username = base_username
    contador = 1

    while User.objects.filter(username=username).exists():
        contador += 1
        username = f"{base_username}{contador}"

    return User.objects.create_user(
        username=username,
        email=email_normalizado,
        first_name=(nombre_limpio or username)[:150],
    )


def _buscar_usuario_por_email(email):
    User = get_user_model()
    email_normalizado = _limpiar_texto_plano(email, max_length=254).lower()
    return User.objects.filter(email__iexact=email_normalizado).first()


def _obtener_asientos_invalidos(asientos):
    return [asiento for asiento in asientos if not ASIENTO_REGEX.fullmatch(asiento)]


def _obtener_asientos_reservados(evento):
    reservas = Reserva.objects.filter(
        evento=evento,
        estado__in=[Reserva.Estado.PENDIENTE, Reserva.Estado.CONFIRMADA],
    )

    asientos = set()
    for reserva in reservas:
        asientos.update(_normalizar_asientos(reserva.asientos))
    return asientos


def _normalizar_categoria(valor):
    if valor in (None, ""):
        return None

    texto = str(valor).strip().lower()
    return EVENTO_CATEGORIAS.get(texto)


def _parse_bool(valor, default=None):
    if valor is None:
        return default

    if isinstance(valor, bool):
        return valor

    texto = str(valor).strip().lower()
    equivalencias = {
        "1": True,
        "true": True,
        "t": True,
        "yes": True,
        "si": True,
        "no": False,
        "0": False,
        "false": False,
        "f": False,
    }
    return equivalencias.get(texto, default)


def _respuesta_error_validacion(mensaje, errores, status=400):
    return _json_response({"mensaje": mensaje, "errores": errores}, status=status)


def _respuesta_requiere_autenticacion(request, mensaje):
    if request.user.is_authenticated:
        return None
    return _json_response({"mensaje": mensaje}, status=401)


def _respuesta_requiere_staff(request, mensaje):
    auth_error = _respuesta_requiere_autenticacion(
        request,
        "Debes iniciar sesion para acceder a este recurso.",
    )
    if auth_error:
        return auth_error

    if _usuario_es_staff(request.user):
        return None

    return _json_response({"mensaje": mensaje}, status=403)


def _errores_desde_validacion(exc):
    if hasattr(exc, "message_dict"):
        return exc.message_dict
    return {"detalle": exc.messages}


def _validar_password(password, usuario=None):
    try:
        validate_password(password, user=usuario)
    except ValidationError as exc:
        return _respuesta_error_validacion(
            "La contrasena no cumple con los requisitos minimos.",
            {"password": exc.messages},
        )
    return None


def _validar_payload_evento(payload, partial=False):
    datos = {}
    errores = {}

    titulo = _buscar_valor(payload, "titulo", "title")
    if titulo is MISSING:
        if not partial:
            errores["titulo"] = ["Este campo es obligatorio."]
    else:
        titulo = _limpiar_texto_plano(titulo, max_length=200)
        if not titulo:
            errores["titulo"] = ["Debes indicar un titulo para el evento."]
        else:
            datos["titulo"] = titulo[:200]

    descripcion = _buscar_valor(payload, "descripcion", "description")
    if descripcion is MISSING:
        if not partial:
            errores["descripcion"] = ["Este campo es obligatorio."]
    else:
        descripcion = _limpiar_texto_plano(descripcion)
        if not descripcion:
            errores["descripcion"] = ["Debes indicar una descripcion."]
        else:
            datos["descripcion"] = descripcion

    fecha_valor = _buscar_valor(payload, "fecha", "date")
    if fecha_valor is MISSING:
        if not partial:
            errores["fecha"] = ["Este campo es obligatorio."]
    else:
        fecha = parse_date(str(fecha_valor).strip())
        if not fecha:
            errores["fecha"] = ["La fecha debe usar el formato YYYY-MM-DD."]
        else:
            datos["fecha"] = fecha

    hora_valor = _buscar_valor(payload, "hora", "time")
    if hora_valor is MISSING:
        if not partial:
            errores["hora"] = ["Este campo es obligatorio."]
    else:
        hora = parse_time(str(hora_valor).strip())
        if not hora:
            errores["hora"] = ["La hora debe usar el formato HH:MM."]
        else:
            datos["hora"] = hora

    precio_valor = _buscar_valor(payload, "precio", "price")
    if precio_valor is MISSING:
        if not partial:
            errores["precio"] = ["Este campo es obligatorio."]
    else:
        try:
            precio = Decimal(str(precio_valor).strip())
        except (InvalidOperation, ValueError):
            errores["precio"] = ["Debes indicar un monto numerico valido."]
        else:
            if precio < 0:
                errores["precio"] = ["El precio no puede ser negativo."]
            else:
                datos["precio"] = precio

    categoria_valor = _buscar_valor(payload, "categoria", "category")
    if categoria_valor is MISSING:
        if not partial:
            datos["categoria"] = Evento.Categoria.OTRO
    else:
        categoria = _normalizar_categoria(categoria_valor)
        if not categoria:
            categorias_validas = ", ".join(value for value, _ in Evento.Categoria.choices)
            errores["categoria"] = [
                f"Categoria invalida. Usa uno de estos valores: {categorias_validas}."
            ]
        else:
            datos["categoria"] = categoria

    imagen_valor = _buscar_valor(payload, "imagen", "image")
    if imagen_valor is not MISSING:
        imagen_texto = str(imagen_valor or "").strip()
        imagen = _normalizar_imagen(imagen_texto)
        if imagen_texto and not imagen:
            errores["imagen"] = [
                "La imagen debe usar una URL segura http(s) o una ruta relativa local."
            ]
        else:
            datos["imagen"] = imagen
    elif not partial:
        datos["imagen"] = None

    publicado_valor = _buscar_valor(payload, "publicado", "published")
    if publicado_valor is not MISSING:
        publicado = _parse_bool(publicado_valor)
        if publicado is None:
            errores["publicado"] = ["El campo publicado debe ser true o false."]
        else:
            datos["publicado"] = publicado
    elif not partial:
        datos["publicado"] = True

    return datos, errores


@require_GET
def inicio_backend(request):
    return render(
        request,
        "api/inicio_backend.html",
        {
            "total_eventos": Evento.objects.filter(publicado=True).count(),
        },
    )


@require_GET
def eventos_panel(request):
    eventos = Evento.objects.filter(publicado=True)
    return render(request, "api/eventos_list.html", {"eventos": eventos})


@require_GET
def info_api(request):
    return _json_response(
        {
            "mensaje": "API Restful del Teatro Nacional Eduardo Brito",
            "version": "v1",
            "features": [
                "cartelera publica",
                "autenticacion con sesiones",
                "autorizacion por roles",
                "reservas por usuario",
            ],
            "endpoints": {
                "frontend": "/",
                "backend": "/backend/",
                "config": "/api/config/",
                "listar_eventos": "/api/eventos/",
                "detalle_evento": "/api/eventos/<id>/",
                "reservas": "/api/reservas/",
                "detalle_reserva": "/api/reservas/<codigo_reserva>/",
                "registro": "/api/auth/register/",
                "login": "/api/auth/login/",
                "session": "/api/auth/session/",
                "logout": "/api/auth/logout/",
                "panel_eventos": "/eventos/",
                "admin": "/admin/",
            },
        }
    )


@require_GET
def frontend_config_api(request):
    return _json_response(FRONTEND_CONFIG)


@require_http_methods(["GET", "POST", "OPTIONS"])
def listar_eventos(request):
    if request.method == "OPTIONS":
        return _empty_response()

    if request.method == "GET":
        incluir_ocultos = _parse_bool(
            request.GET.get("include_unpublished")
            or request.GET.get("incluir_ocultos"),
            default=False,
        )
        categoria = _normalizar_categoria(
            request.GET.get("categoria") or request.GET.get("category")
        )

        eventos = Evento.objects.all()

        if not (incluir_ocultos and _usuario_es_staff(request.user)):
            eventos = eventos.filter(publicado=True)

        if categoria:
            eventos = eventos.filter(categoria=categoria)

        data = [_serializar_evento(evento) for evento in eventos]
        return _json_response({"total": len(data), "eventos": data})

    permiso_error = _respuesta_requiere_staff(
        request,
        "Solo el personal administrativo puede crear eventos.",
    )
    if permiso_error:
        return permiso_error

    payload = _extraer_payload(request)
    if payload is None:
        return _json_response({"mensaje": "El cuerpo JSON no es valido."}, status=400)

    datos, errores = _validar_payload_evento(payload)
    if errores:
        return _respuesta_error_validacion(
            "No se pudo crear el evento por errores de validacion.",
            errores,
        )

    evento = Evento(**datos)

    try:
        evento.full_clean()
    except ValidationError as exc:
        return _respuesta_error_validacion(
            "No se pudo crear el evento por errores de validacion.",
            _errores_desde_validacion(exc),
        )

    evento.save()
    return _json_response(
        {
            "mensaje": "Evento creado correctamente.",
            "evento": _serializar_evento(evento),
        },
        status=201,
    )


@require_http_methods(["GET", "PUT", "PATCH", "DELETE", "OPTIONS"])
def detalle_evento_api(request, evento_id):
    if request.method == "OPTIONS":
        return _empty_response()

    try:
        evento = Evento.objects.get(pk=evento_id)
    except Evento.DoesNotExist:
        return _json_response({"mensaje": "Evento no encontrado."}, status=404)

    if request.method == "GET":
        if not evento.publicado and not _usuario_es_staff(request.user):
            return _json_response({"mensaje": "Evento no encontrado."}, status=404)
        return _json_response({"evento": _serializar_evento(evento)})

    permiso_error = _respuesta_requiere_staff(
        request,
        "Solo el personal administrativo puede modificar eventos.",
    )
    if permiso_error:
        return permiso_error

    if request.method == "DELETE":
        if evento.publicado:
            evento.publicado = False
            evento.save(update_fields=["publicado"])

        return _json_response(
            {
                "mensaje": "Evento retirado correctamente de la cartelera publica.",
                "evento": _serializar_evento(evento),
            }
        )

    payload = _extraer_payload(request)
    if payload is None:
        return _json_response({"mensaje": "El cuerpo JSON no es valido."}, status=400)

    datos, errores = _validar_payload_evento(payload, partial=True)
    if errores:
        return _respuesta_error_validacion(
            "No se pudo actualizar el evento por errores de validacion.",
            errores,
        )

    if not datos:
        return _json_response(
            {"mensaje": "Debes enviar al menos un campo para actualizar el evento."},
            status=400,
        )

    for campo, valor in datos.items():
        setattr(evento, campo, valor)

    try:
        evento.full_clean()
    except ValidationError as exc:
        return _respuesta_error_validacion(
            "No se pudo actualizar el evento por errores de validacion.",
            _errores_desde_validacion(exc),
        )

    evento.save(update_fields=list(datos.keys()))
    return _json_response(
        {
            "mensaje": "Evento actualizado correctamente.",
            "evento": _serializar_evento(evento),
        }
    )


@require_http_methods(["POST", "OPTIONS"])
def auth_register_api(request):
    if request.method == "OPTIONS":
        return _empty_response()

    payload = _extraer_payload(request)
    if payload is None:
        return _json_response({"mensaje": "El cuerpo JSON no es valido."}, status=400)

    nombre = _limpiar_texto_plano(payload.get("nombre") or payload.get("name"), max_length=150)
    email = _limpiar_texto_plano(payload.get("email"), max_length=254).lower()
    password = str(payload.get("password") or "").strip()

    if not nombre or not email or not password:
        return _json_response(
            {"mensaje": "Debes enviar nombre, email y password para registrarte."},
            status=400,
        )

    usuario_existente = _buscar_usuario_por_email(email)

    password_error = _validar_password(password, usuario=usuario_existente)
    if password_error:
        return password_error

    if usuario_existente and usuario_existente.has_usable_password():
        return _json_response(
            {"mensaje": "Ya existe una cuenta registrada con ese correo."},
            status=409,
        )

    if usuario_existente:
        usuario_existente.first_name = nombre[:150]
        usuario_existente.set_password(password)
        usuario_existente.save(update_fields=["first_name", "password"])
        login(request, usuario_existente)
        return _json_response(
            {
                "mensaje": "Cuenta actualizada correctamente.",
                "usuario": _serializar_usuario(usuario_existente),
            }
        )

    usuario = _obtener_usuario(nombre, email)
    usuario.first_name = nombre[:150]
    usuario.set_password(password)
    usuario.save(update_fields=["first_name", "password"])
    login(request, usuario)

    return _json_response(
        {
            "mensaje": "Cuenta creada correctamente.",
            "usuario": _serializar_usuario(usuario),
        },
        status=201,
    )


@require_http_methods(["POST", "OPTIONS"])
def auth_login_api(request):
    if request.method == "OPTIONS":
        return _empty_response()

    payload = _extraer_payload(request)
    if payload is None:
        return _json_response({"mensaje": "El cuerpo JSON no es valido."}, status=400)

    email = _limpiar_texto_plano(payload.get("email"), max_length=254).lower()
    password = str(payload.get("password") or "").strip()

    if not email or not password:
        return _json_response(
            {"mensaje": "Debes enviar email y password para iniciar sesion."},
            status=400,
        )

    usuario = _buscar_usuario_por_email(email)
    if not usuario:
        return _json_response({"mensaje": "No existe una cuenta con ese correo."}, status=404)

    usuario_autenticado = authenticate(
        request,
        username=usuario.get_username(),
        password=password,
    )
    if not usuario_autenticado:
        return _json_response({"mensaje": "Credenciales invalidas."}, status=401)

    login(request, usuario_autenticado)

    return _json_response(
        {
            "mensaje": "Inicio de sesion correcto.",
            "usuario": _serializar_usuario(usuario_autenticado),
        }
    )


@require_http_methods(["GET", "OPTIONS"])
def auth_session_api(request):
    if request.method == "OPTIONS":
        return _empty_response()

    if not request.user.is_authenticated:
        return _json_response({"mensaje": "No hay una sesion activa."}, status=401)

    return _json_response(
        {
            "mensaje": "Sesion activa.",
            "usuario": _serializar_usuario(request.user),
        }
    )


@require_http_methods(["POST", "OPTIONS"])
def auth_logout_api(request):
    if request.method == "OPTIONS":
        return _empty_response()

    logout(request)
    return _json_response({"mensaje": "Sesion cerrada correctamente."})


@require_http_methods(["GET", "POST", "OPTIONS"])
def reservas_api(request):
    if request.method == "OPTIONS":
        return _empty_response()

    if request.method == "GET":
        evento_id = request.GET.get("evento_id")
        scope = str(request.GET.get("scope") or "").strip().lower()
        incluir_canceladas = _parse_bool(
            request.GET.get("include_cancelled")
            or request.GET.get("include_canceled")
            or request.GET.get("incluir_canceladas"),
            default=False,
        )

        if evento_id:
            try:
                evento = Evento.objects.get(pk=evento_id, publicado=True)
            except (Evento.DoesNotExist, ValueError):
                return _json_response({"mensaje": "Evento no encontrado."}, status=404)

            asientos_reservados = sorted(_obtener_asientos_reservados(evento))
            return _json_response(
                {
                    "evento_id": evento.id,
                    "total": len(asientos_reservados),
                    "asientos_reservados": asientos_reservados,
                }
            )

        if scope == "all":
            permiso_error = _respuesta_requiere_staff(
                request,
                "Solo el personal administrativo puede consultar todas las reservas.",
            )
            if permiso_error:
                return permiso_error

            reservas = Reserva.objects.select_related("evento", "usuario").all()
            if not incluir_canceladas:
                reservas = reservas.exclude(estado=Reserva.Estado.CANCELADA)

            data = [
                _serializar_reserva(reserva, incluir_usuario=True)
                for reserva in reservas
            ]
            return _json_response({"total": len(data), "reservas": data})

        auth_error = _respuesta_requiere_autenticacion(
            request,
            "Debes iniciar sesion para ver tus reservas.",
        )
        if auth_error:
            return auth_error

        reservas = Reserva.objects.select_related("evento", "usuario").filter(
            usuario=request.user,
        )
        if not incluir_canceladas:
            reservas = reservas.exclude(estado=Reserva.Estado.CANCELADA)

        data = [_serializar_reserva(reserva) for reserva in reservas]
        return _json_response({"total": len(data), "reservas": data})

    payload = _extraer_payload(request)
    if payload is None:
        return _json_response({"mensaje": "El cuerpo JSON no es valido."}, status=400)

    auth_error = _respuesta_requiere_autenticacion(
        request,
        "Debes iniciar sesion para crear una reserva.",
    )
    if auth_error:
        return auth_error

    evento_id = payload.get("evento_id") or payload.get("event_id") or payload.get("evento")
    asientos = _normalizar_asientos(payload.get("asientos") or payload.get("seats"))

    if not evento_id or not asientos:
        return _json_response(
            {
                "mensaje": "Debes enviar evento_id y al menos un asiento para crear la reserva."
            },
            status=400,
        )

    asientos_invalidos = _obtener_asientos_invalidos(asientos)
    if asientos_invalidos:
        return _json_response(
            {
                "mensaje": "Uno o mas asientos no existen en el mapa del teatro.",
                "asientos_invalidos": asientos_invalidos,
            },
            status=400,
        )

    with transaction.atomic():
        try:
            evento = Evento.objects.select_for_update().get(pk=evento_id, publicado=True)
        except (Evento.DoesNotExist, ValueError):
            return _json_response({"mensaje": "El evento solicitado no existe."}, status=404)

        if evento.fecha < timezone.localdate():
            return _json_response(
                {"mensaje": "No se pueden reservar eventos que ya pasaron."},
                status=400,
            )

        asientos_ocupados = _obtener_asientos_reservados(evento)
        asientos_en_conflicto = [asiento for asiento in asientos if asiento in asientos_ocupados]
        if asientos_en_conflicto:
            return _json_response(
                {
                    "mensaje": "Algunos asientos ya fueron reservados.",
                    "asientos_en_conflicto": asientos_en_conflicto,
                },
                status=409,
            )

        total_pagado = evento.precio * len(asientos)
        reserva = Reserva.objects.create(
            usuario=request.user,
            evento=evento,
            asientos=", ".join(asientos),
            total_pagado=total_pagado,
        )

    return _json_response(
        {
            "mensaje": "Reserva creada correctamente.",
            "reserva": _serializar_reserva(reserva),
        },
        status=201,
    )


@require_http_methods(["GET", "PATCH", "DELETE", "OPTIONS"])
def detalle_reserva_api(request, codigo_reserva):
    if request.method == "OPTIONS":
        return _empty_response()

    auth_error = _respuesta_requiere_autenticacion(
        request,
        "Debes iniciar sesion para consultar reservas.",
    )
    if auth_error:
        return auth_error

    try:
        reserva = Reserva.objects.select_related("evento", "usuario").get(
            codigo_reserva=codigo_reserva
        )
    except Reserva.DoesNotExist:
        return _json_response({"mensaje": "Reserva no encontrada."}, status=404)

    es_staff = _usuario_es_staff(request.user)
    if not es_staff and reserva.usuario_id != request.user.id:
        return _json_response(
            {"mensaje": "No tienes permisos para acceder a esta reserva."},
            status=403,
        )

    if request.method == "GET":
        return _json_response(
            {
                "reserva": _serializar_reserva(
                    reserva,
                    incluir_usuario=es_staff,
                )
            }
        )

    if request.method == "DELETE":
        if reserva.estado != Reserva.Estado.CANCELADA:
            reserva.estado = Reserva.Estado.CANCELADA
            reserva.save(update_fields=["estado"])

        return _json_response(
            {
                "mensaje": "Reserva cancelada correctamente.",
                "reserva": _serializar_reserva(
                    reserva,
                    incluir_usuario=es_staff,
                ),
            }
        )

    payload = _extraer_payload(request)
    if payload is None:
        return _json_response({"mensaje": "El cuerpo JSON no es valido."}, status=400)

    estado = str(payload.get("estado") or payload.get("status") or "").strip().lower()
    if not estado:
        return _json_response(
            {"mensaje": "Debes indicar el nuevo estado de la reserva."},
            status=400,
        )

    estados_validos = {value for value, _ in Reserva.Estado.choices}
    if estado not in estados_validos:
        return _json_response(
            {
                "mensaje": "El estado enviado no es valido.",
                "estados_validos": sorted(estados_validos),
            },
            status=400,
        )

    if not es_staff and estado != Reserva.Estado.CANCELADA:
        return _json_response(
            {
                "mensaje": "Solo el personal administrativo puede cambiar la reserva a un estado distinto de cancelada."
            },
            status=403,
        )

    reserva.estado = estado
    reserva.save(update_fields=["estado"])

    return _json_response(
        {
            "mensaje": "Reserva actualizada correctamente.",
            "reserva": _serializar_reserva(
                reserva,
                incluir_usuario=es_staff,
            ),
        }
    )
