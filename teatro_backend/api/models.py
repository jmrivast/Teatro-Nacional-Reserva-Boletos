from uuid import uuid4

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


def generar_codigo_reserva():
    return uuid4().hex[:10].upper()


class Evento(models.Model):
    class Categoria(models.TextChoices):
        OBRA = "obra", "Obra de teatro"
        MUSICAL = "musical", "Musical"
        RECITAL = "recital", "Recital"
        BALLET = "ballet", "Ballet"
        CONCIERTO = "concierto", "Concierto"
        OTRO = "otro", "Otro"

    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    fecha = models.DateField()
    hora = models.TimeField()
    precio = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    imagen = models.URLField(max_length=500, blank=True, null=True)
    categoria = models.CharField(
        max_length=20,
        choices=Categoria.choices,
        default=Categoria.OTRO,
    )
    publicado = models.BooleanField(default=True)

    class Meta:
        ordering = ("fecha", "hora", "titulo")
        verbose_name = "evento"
        verbose_name_plural = "eventos"

    def __str__(self):
        return f"{self.titulo} ({self.fecha:%d/%m/%Y})"


class Reserva(models.Model):
    class Estado(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        CONFIRMADA = "confirmada", "Confirmada"
        CANCELADA = "cancelada", "Cancelada"

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reservas",
    )
    evento = models.ForeignKey(
        Evento,
        on_delete=models.CASCADE,
        related_name="reservas",
    )
    codigo_reserva = models.CharField(
        max_length=12,
        editable=False,
        default=generar_codigo_reserva,
        unique=True,
    )
    asientos = models.CharField(
        max_length=255,
        help_text="Asientos separados por comas, ej: A1, A2",
    )
    total_pagado = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.CONFIRMADA,
    )
    fecha_reserva = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-fecha_reserva",)
        verbose_name = "reserva"
        verbose_name_plural = "reservas"

    def __str__(self):
        return f"{self.codigo_reserva} - {self.usuario}"

    @property
    def cantidad_asientos(self):
        return len([asiento for asiento in self.asientos.split(",") if asiento.strip()])
