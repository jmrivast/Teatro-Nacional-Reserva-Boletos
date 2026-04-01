from django.db import migrations, models

import api.models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0003_seed_eventos"),
    ]

    operations = [
        migrations.AlterField(
            model_name="reserva",
            name="codigo_reserva",
            field=models.CharField(
                default=api.models.generar_codigo_reserva,
                editable=False,
                max_length=12,
                unique=True,
            ),
        ),
    ]
