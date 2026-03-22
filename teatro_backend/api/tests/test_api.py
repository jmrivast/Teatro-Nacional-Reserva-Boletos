from datetime import date, time
from decimal import Decimal

from django.test import TestCase
from django.urls import reverse

from api.models import Evento


class EventoApiTests(TestCase):
    def setUp(self):
        self.evento_publicado = Evento.objects.create(
            titulo="Gala Sinfonica",
            descripcion="Concierto inaugural del teatro.",
            fecha=date(2026, 4, 10),
            hora=time(19, 30),
            precio=Decimal("1800.00"),
            imagen="https://example.com/gala.jpg",
            categoria=Evento.Categoria.CONCIERTO,
            publicado=True,
        )
        Evento.objects.create(
            titulo="Evento Oculto",
            descripcion="No debe mostrarse al publico.",
            fecha=date(2026, 4, 12),
            hora=time(20, 0),
            precio=Decimal("900.00"),
            categoria=Evento.Categoria.OTRO,
            publicado=False,
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

    def test_panel_eventos_muestra_evento_publicado(self):
        response = self.client.get(reverse("eventos_panel"))

        self.assertContains(response, "Gala Sinfonica")
        self.assertNotContains(response, "Evento Oculto")

    def test_frontend_principal_responde(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Teatro Nacional Eduardo Brito")
