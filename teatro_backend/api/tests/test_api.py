import json
from datetime import timedelta, time
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from api.models import Evento, Reserva


class EventoApiTests(TestCase):
    def setUp(self):
        fecha_base = timezone.localdate() + timedelta(days=30)

        self.evento_publicado = Evento.objects.create(
            titulo="Gala Sinfonica",
            descripcion="Concierto inaugural del teatro.",
            fecha=fecha_base,
            hora=time(19, 30),
            precio=Decimal("1800.00"),
            imagen="https://example.com/gala.jpg",
            categoria=Evento.Categoria.CONCIERTO,
            publicado=True,
        )
        Evento.objects.create(
            titulo="Evento Oculto",
            descripcion="No debe mostrarse al publico.",
            fecha=fecha_base + timedelta(days=2),
            hora=time(20, 0),
            precio=Decimal("900.00"),
            categoria=Evento.Categoria.OTRO,
            publicado=False,
        )

    def crear_staff(self, username="staff", email="staff@example.com"):
        return get_user_model().objects.create_user(
            username=username,
            email=email,
            password="ClaveSegura123!",
            first_name="Admin",
            is_staff=True,
        )

    def test_api_lista_solo_eventos_publicados(self):
        response = self.client.get(reverse("listar_eventos"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Access-Control-Allow-Origin"], "*")

        payload = response.json()
        titulos = [evento["title"] for evento in payload["eventos"]]

        self.assertEqual(payload["total"], len(payload["eventos"]))
        self.assertIn(self.evento_publicado.titulo, titulos)
        self.assertNotIn("Evento Oculto", titulos)

    def test_api_detalle_evento_publicado(self):
        response = self.client.get(
            reverse("detalle_evento_api", args=[self.evento_publicado.id])
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()["evento"]

        self.assertEqual(payload["id"], self.evento_publicado.id)
        self.assertEqual(payload["title"], "Gala Sinfonica")
        self.assertTrue(payload["published"])

    def test_api_evento_oculto_solo_es_visible_para_staff(self):
        evento_oculto = Evento.objects.get(titulo="Evento Oculto")

        publico = self.client.get(reverse("detalle_evento_api", args=[evento_oculto.id]))
        self.assertEqual(publico.status_code, 404)

        staff = self.crear_staff()
        self.client.force_login(staff)
        staff_response = self.client.get(
            reverse("detalle_evento_api", args=[evento_oculto.id])
        )

        self.assertEqual(staff_response.status_code, 200)
        self.assertFalse(staff_response.json()["evento"]["published"])

    def test_api_solo_staff_puede_crear_eventos(self):
        usuario = get_user_model().objects.create_user(
            username="cliente",
            email="cliente@example.com",
            password="ClaveSegura123!",
        )
        payload = {
            "titulo": "Nueva Temporada",
            "descripcion": "Estreno exclusivo.",
            "fecha": (timezone.localdate() + timedelta(days=60)).isoformat(),
            "hora": "20:00",
            "precio": "2200.00",
            "categoria": Evento.Categoria.MUSICAL,
            "publicado": True,
        }

        self.client.force_login(usuario)
        response = self.client.post(
            reverse("listar_eventos"),
            data=json.dumps(payload),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Evento.objects.filter(titulo="Nueva Temporada").count(), 0)

    def test_api_staff_puede_crear_actualizar_y_retirar_eventos(self):
        staff = self.crear_staff()
        self.client.force_login(staff)

        payload = {
            "titulo": "Festival Coral",
            "descripcion": "Grandes voces en una sola noche.",
            "fecha": (timezone.localdate() + timedelta(days=75)).isoformat(),
            "hora": "21:00",
            "precio": "2500.00",
            "categoria": Evento.Categoria.CONCIERTO,
            "imagen": "https://example.com/festival.jpg",
            "publicado": True,
        }

        create_response = self.client.post(
            reverse("listar_eventos"),
            data=json.dumps(payload),
            content_type="application/json",
        )

        self.assertEqual(create_response.status_code, 201)
        evento_id = create_response.json()["evento"]["id"]

        update_response = self.client.patch(
            reverse("detalle_evento_api", args=[evento_id]),
            data=json.dumps({"precio": "2800.00", "publicado": False}),
            content_type="application/json",
        )

        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.json()["evento"]["price"], 2800.0)
        self.assertFalse(update_response.json()["evento"]["published"])

        delete_response = self.client.delete(reverse("detalle_evento_api", args=[evento_id]))
        self.assertEqual(delete_response.status_code, 200)

        evento = Evento.objects.get(pk=evento_id)
        self.assertFalse(evento.publicado)

    def test_panel_eventos_muestra_evento_publicado(self):
        response = self.client.get(reverse("eventos_panel"))

        self.assertContains(response, "Gala Sinfonica")
        self.assertNotContains(response, "Evento Oculto")

    def test_frontend_principal_responde(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Teatro Nacional Eduardo Brito")

    def test_api_config_expone_mapa_y_sede(self):
        response = self.client.get(reverse("frontend_config_api"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()

        self.assertEqual(payload["venue_name"], "Teatro Nacional Eduardo Brito")
        self.assertEqual(payload["seat_map"]["rows"], ["A", "B", "C", "D", "E", "F"])
        self.assertEqual(payload["seat_map"]["columns"], 12)

    def test_api_registra_usuario_desde_frontend_y_abre_sesion(self):
        payload = {
            "name": "Laura Martinez",
            "email": "laura@example.com",
            "password": "ClaveSegura123!",
        }

        response = self.client.post(
            reverse("auth_register_api"),
            data=json.dumps(payload),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)

        usuario = get_user_model().objects.get(email="laura@example.com")
        self.assertEqual(usuario.first_name, "Laura Martinez")
        self.assertTrue(usuario.check_password("ClaveSegura123!"))

        data = response.json()["usuario"]
        self.assertEqual(data["email"], "laura@example.com")
        self.assertEqual(data["name"], "Laura Martinez")
        self.assertEqual(data["role"], "cliente")

        session_response = self.client.get(reverse("auth_session_api"))
        self.assertEqual(session_response.status_code, 200)
        self.assertEqual(session_response.json()["usuario"]["email"], "laura@example.com")

    def test_api_login_valida_credenciales_y_abre_sesion(self):
        usuario = get_user_model().objects.create_user(
            username="sofia",
            email="sofia@example.com",
            password="ClaveSegura123!",
            first_name="Sofia",
        )

        response = self.client.post(
            reverse("auth_login_api"),
            data=json.dumps(
                {
                    "email": usuario.email,
                    "password": "ClaveSegura123!",
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()

        self.assertEqual(payload["usuario"]["email"], "sofia@example.com")
        self.assertEqual(payload["usuario"]["name"], "Sofia")
        self.assertEqual(payload["usuario"]["role"], "cliente")

        session_response = self.client.get(reverse("auth_session_api"))
        self.assertEqual(session_response.status_code, 200)
        self.assertEqual(session_response.json()["usuario"]["email"], "sofia@example.com")

    def test_api_logout_cierra_la_sesion(self):
        usuario = get_user_model().objects.create_user(
            username="logout",
            email="logout@example.com",
            password="ClaveSegura123!",
        )
        self.client.force_login(usuario)

        response = self.client.post(reverse("auth_logout_api"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get(reverse("auth_session_api")).status_code, 401)

    def test_api_session_expone_rol_y_permisos_para_staff(self):
        staff = self.crear_staff(username="gestor", email="gestor@example.com")
        self.client.force_login(staff)

        response = self.client.get(reverse("auth_session_api"))

        self.assertEqual(response.status_code, 200)
        usuario = response.json()["usuario"]
        self.assertEqual(usuario["role"], "admin")
        self.assertTrue(usuario["is_staff"])
        self.assertIn("eventos:gestionar", usuario["permissions"])

    def test_api_requiere_sesion_para_listar_y_crear_reservas(self):
        list_response = self.client.get(reverse("reservas_api"))
        create_response = self.client.post(
            reverse("reservas_api"),
            data=json.dumps({"event_id": self.evento_publicado.id, "seats": ["A1"]}),
            content_type="application/json",
        )

        self.assertEqual(list_response.status_code, 401)
        self.assertEqual(create_response.status_code, 401)

    def test_api_crea_reserva_para_usuario_autenticado(self):
        usuario = get_user_model().objects.create_user(
            username="cliente",
            email="cliente@example.com",
            password="clave-segura-123",
            first_name="Cliente",
        )
        otro_usuario = get_user_model().objects.create_user(
            username="otro",
            email="otro@example.com",
            password="clave-segura-123",
        )
        self.client.force_login(usuario)

        payload = {
            "email": otro_usuario.email,
            "event_id": self.evento_publicado.id,
            "seats": ["C1", "C2"],
        }

        response = self.client.post(
            reverse("reservas_api"),
            data=json.dumps(payload),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Reserva.objects.count(), 1)

        reserva = Reserva.objects.select_related("usuario", "evento").get()
        self.assertEqual(reserva.usuario, usuario)
        self.assertEqual(reserva.evento, self.evento_publicado)
        self.assertEqual(reserva.asientos, "C1, C2")
        self.assertEqual(reserva.total_pagado, Decimal("3600.00"))

        data = response.json()["reserva"]
        self.assertEqual(data["seats"], ["C1", "C2"])
        self.assertEqual(data["total"], 3600.0)

    def test_api_lista_solo_reservas_del_usuario_autenticado(self):
        usuario = get_user_model().objects.create_user(
            username="cliente",
            email="cliente@example.com",
            password="clave-segura-123",
        )
        otro_usuario = get_user_model().objects.create_user(
            username="externo",
            email="externo@example.com",
            password="clave-segura-123",
        )
        Reserva.objects.create(
            usuario=usuario,
            evento=self.evento_publicado,
            asientos="D4, D5",
            total_pagado=Decimal("3600.00"),
        )
        Reserva.objects.create(
            usuario=otro_usuario,
            evento=self.evento_publicado,
            asientos="E1",
            total_pagado=Decimal("1800.00"),
        )

        self.client.force_login(usuario)
        response = self.client.get(reverse("reservas_api"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()

        self.assertEqual(payload["total"], 1)
        self.assertEqual(payload["reservas"][0]["seats"], ["D4", "D5"])
        self.assertEqual(payload["reservas"][0]["event"]["title"], "Gala Sinfonica")

    def test_api_staff_puede_consultar_todas_las_reservas(self):
        staff = self.crear_staff(username="staffres", email="staffres@example.com")
        usuario = get_user_model().objects.create_user(
            username="cliente",
            email="cliente@example.com",
            password="clave-segura-123",
        )
        Reserva.objects.create(
            usuario=usuario,
            evento=self.evento_publicado,
            asientos="F1, F2",
            total_pagado=Decimal("3600.00"),
        )

        self.client.force_login(staff)
        response = self.client.get(reverse("reservas_api"), {"scope": "all"})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["total"], 1)
        self.assertEqual(payload["reservas"][0]["user"]["email"], "cliente@example.com")

    def test_api_devuelve_asientos_reservados_por_evento(self):
        usuario = get_user_model().objects.create_user(
            username="boletas",
            email="boletas@example.com",
            password="clave-segura-123",
        )
        Reserva.objects.create(
            usuario=usuario,
            evento=self.evento_publicado,
            asientos="A1, A2",
            total_pagado=Decimal("3600.00"),
        )

        response = self.client.get(
            reverse("reservas_api"),
            {"evento_id": self.evento_publicado.id},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["asientos_reservados"], ["A1", "A2"])

    def test_api_rechaza_asientos_invalidos(self):
        usuario = get_user_model().objects.create_user(
            username="invalido",
            email="invalido@example.com",
            password="clave-segura-123",
        )
        self.client.force_login(usuario)

        response = self.client.post(
            reverse("reservas_api"),
            data=json.dumps(
                {
                    "event_id": self.evento_publicado.id,
                    "seats": ["A1", "Z99"],
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["asientos_invalidos"], ["Z99"])

    def test_api_rechaza_asientos_ya_reservados(self):
        usuario = get_user_model().objects.create_user(
            username="titular",
            email="titular@example.com",
            password="clave-segura-123",
        )
        Reserva.objects.create(
            usuario=usuario,
            evento=self.evento_publicado,
            asientos="B2",
            total_pagado=Decimal("1800.00"),
        )

        self.client.force_login(usuario)
        response = self.client.post(
            reverse("reservas_api"),
            data=json.dumps(
                {
                    "event_id": self.evento_publicado.id,
                    "seats": ["B2", "B3"],
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["asientos_en_conflicto"], ["B2"])

    def test_api_detalle_reserva_respeta_propiedad_del_recurso(self):
        titular = get_user_model().objects.create_user(
            username="titular",
            email="titular@example.com",
            password="clave-segura-123",
        )
        ajeno = get_user_model().objects.create_user(
            username="ajeno",
            email="ajeno@example.com",
            password="clave-segura-123",
        )
        reserva = Reserva.objects.create(
            usuario=titular,
            evento=self.evento_publicado,
            asientos="A3",
            total_pagado=Decimal("1800.00"),
        )

        self.client.force_login(ajeno)
        forbidden_response = self.client.get(
            reverse("detalle_reserva_api", args=[reserva.codigo_reserva])
        )
        self.assertEqual(forbidden_response.status_code, 403)

        self.client.force_login(titular)
        own_response = self.client.get(
            reverse("detalle_reserva_api", args=[reserva.codigo_reserva])
        )
        self.assertEqual(own_response.status_code, 200)
        self.assertEqual(own_response.json()["reserva"]["seats"], ["A3"])

    def test_api_usuario_puede_cancelar_su_reserva_desde_detalle(self):
        usuario = get_user_model().objects.create_user(
            username="cancelador",
            email="cancelador@example.com",
            password="clave-segura-123",
        )
        reserva = Reserva.objects.create(
            usuario=usuario,
            evento=self.evento_publicado,
            asientos="C4, C5",
            total_pagado=Decimal("3600.00"),
        )

        self.client.force_login(usuario)
        response = self.client.patch(
            reverse("detalle_reserva_api", args=[reserva.codigo_reserva]),
            data=json.dumps({"estado": Reserva.Estado.CANCELADA}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        reserva.refresh_from_db()
        self.assertEqual(reserva.estado, Reserva.Estado.CANCELADA)

    def test_api_staff_puede_confirmar_reserva_desde_detalle(self):
        staff = self.crear_staff(username="aprobador", email="aprobador@example.com")
        usuario = get_user_model().objects.create_user(
            username="pendiente",
            email="pendiente@example.com",
            password="clave-segura-123",
        )
        reserva = Reserva.objects.create(
            usuario=usuario,
            evento=self.evento_publicado,
            asientos="E3",
            total_pagado=Decimal("1800.00"),
            estado=Reserva.Estado.PENDIENTE,
        )

        self.client.force_login(staff)
        response = self.client.patch(
            reverse("detalle_reserva_api", args=[reserva.codigo_reserva]),
            data=json.dumps({"estado": Reserva.Estado.CONFIRMADA}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["reserva"]["status"], Reserva.Estado.CONFIRMADA)
