from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET

from .models import Evento


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


def _formatear_fecha(fecha):
    return f"{fecha.day} de {MESES[fecha.month - 1]} de {fecha.year}"


def _formatear_hora(hora):
    return hora.strftime("%I:%M %p").lstrip("0")


def _serializar_evento(evento):
    categoria = evento.get_categoria_display()
    hora = evento.hora.strftime("%H:%M")

    return {
        "id": evento.id,
        "titulo": evento.titulo,
        "title": evento.titulo,
        "descripcion": evento.descripcion,
        "description": evento.descripcion,
        "fecha": evento.fecha.isoformat(),
        "date": evento.fecha.isoformat(),
        "date_label": _formatear_fecha(evento.fecha),
        "hora": hora,
        "time": hora,
        "time_label": _formatear_hora(evento.hora),
        "precio": float(evento.precio),
        "price": float(evento.precio),
        "price_label": f"RD$ {evento.precio:,.2f}",
        "imagen": evento.imagen,
        "image": evento.imagen,
        "categoria": categoria,
        "category": categoria,
    }


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
    response = JsonResponse(
        {
            "mensaje": "API básica del Teatro Nacional Eduardo Brito",
            "endpoints": {
                "frontend": "/",
                "backend": "/backend/",
                "listar_eventos": "/api/eventos/",
                "panel_eventos": "/eventos/",
                "admin": "/admin/",
            },
        }
    )
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Headers"] = "Content-Type"
    return response


@require_GET
def listar_eventos(request):
    eventos = Evento.objects.filter(publicado=True)
    data = [_serializar_evento(evento) for evento in eventos]
    response = JsonResponse({"total": len(data), "eventos": data})
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Headers"] = "Content-Type"
    return response
