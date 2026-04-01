from datetime import date, time
from decimal import Decimal

from django.db import migrations


def seed_eventos(apps, schema_editor):
    Evento = apps.get_model("api", "Evento")

    if Evento.objects.exists():
        return

    Evento.objects.bulk_create(
        [
            Evento(
                titulo="El Cascanueces",
                descripcion="El ballet clasico de Tchaikovsky en una presentacion magistral.",
                fecha=date(2026, 12, 15),
                hora=time(20, 0),
                precio=Decimal("1500.00"),
                imagen="https://balletdekiev.com/wp-content/uploads/2024/02/General_cascanueces_24_horizontal_2-scaled.jpg",
                categoria="ballet",
                publicado=True,
            ),
            Evento(
                titulo="Orquesta Sinfonica Nacional - Concierto de Primavera",
                descripcion="La temporada sinfonica arranca con obras de Beethoven y Mozart.",
                fecha=date(2026, 4, 10),
                hora=time(19, 30),
                precio=Decimal("800.00"),
                imagen="https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80",
                categoria="concierto",
                publicado=True,
            ),
            Evento(
                titulo="Romeo y Julieta",
                descripcion="Obra teatral dirigida por Maria Castillo.",
                fecha=date(2026, 5, 5),
                hora=time(20, 0),
                precio=Decimal("1000.00"),
                imagen="https://anagnorisis.es/wp-content/uploads/2024/06/romeo-y-julieta-obra-de-teatro-1.jpg",
                categoria="obra",
                publicado=True,
            ),
        ]
    )


def revert_seed_eventos(apps, schema_editor):
    Evento = apps.get_model("api", "Evento")
    Evento.objects.filter(
        titulo__in=[
            "El Cascanueces",
            "Orquesta Sinfonica Nacional - Concierto de Primavera",
            "Romeo y Julieta",
        ]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0002_alter_evento_options_alter_reserva_options_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_eventos, revert_seed_eventos),
    ]
