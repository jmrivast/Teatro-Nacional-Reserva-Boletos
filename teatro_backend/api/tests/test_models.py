from datetime import date, time
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase

from api.models import Evento, Reserva


class ReservaModelTests(TestCase):
    def test_genera_codigo_y_cuenta_asientos(self):
        usuario = get_user_model().objects.create_user(
            username="maria",
            password="clave-segura-123",
        )
        evento = Evento.objects.create(
            titulo="Romeo y Julieta",
            descripcion="Clasico teatral.",
            fecha=date(2026, 5, 5),
            hora=time(20, 0),
            precio=Decimal("1000.00"),
            categoria=Evento.Categoria.OBRA,
        )

        reserva = Reserva.objects.create(
            usuario=usuario,
            evento=evento,
            asientos="A1, A2, B1",
            total_pagado=Decimal("3000.00"),
        )

        self.assertTrue(reserva.codigo_reserva)
        self.assertEqual(reserva.cantidad_asientos, 3)
