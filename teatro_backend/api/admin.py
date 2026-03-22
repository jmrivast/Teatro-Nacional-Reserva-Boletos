from django.contrib import admin
from .models import Evento, Reserva


@admin.register(Evento)
class EventoAdmin(admin.ModelAdmin):
    list_display = ("titulo", "categoria", "fecha", "hora", "precio", "publicado")
    search_fields = ("titulo", "descripcion")
    list_filter = ("categoria", "fecha", "publicado")
    list_editable = ("publicado",)
    ordering = ("fecha", "hora")


@admin.register(Reserva)
class ReservaAdmin(admin.ModelAdmin):
    list_display = (
        "codigo_reserva",
        "usuario",
        "evento",
        "estado",
        "cantidad_asientos",
        "total_pagado",
        "fecha_reserva",
    )
    search_fields = ("codigo_reserva", "usuario__username", "evento__titulo")
    list_filter = ("estado", "fecha_reserva")
    readonly_fields = ("codigo_reserva", "fecha_reserva")
    autocomplete_fields = ("usuario", "evento")
