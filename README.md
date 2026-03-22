# Teatro Nacional Eduardo Brito - Reserva de Boletos

Proyecto academico para una plataforma web de reserva de boletos del Teatro Nacional Eduardo Brito. La solucion actual combina un frontend interactivo en HTML, CSS y JavaScript con un backend basico en Python y Django usando SQLite como base de datos.

## Alcance actual

- SPA en JavaScript con cartelera, detalle de evento, login/registro simulado, mapa visual de asientos y dashboard.
- Backend Django con modelos para usuarios, eventos y reservas.
- API JSON para listar eventos y vista HTML basica para comprobar el backend.
- Panel de administracion de Django para gestionar eventos y reservas.
- Documentacion del modelo Entidad-Relacion y de la arquitectura del sistema.

## Estructura del proyecto

```text
.
|-- css/
|-- js/
|-- index.html
|-- teatro_backend/
|   |-- api/
|   |-- teatro_backend/
|   |-- manage.py
|   `-- db.sqlite3
|-- docs/
`-- requirements.txt
```

## Tecnologias

- HTML5
- CSS3
- JavaScript
- jQuery
- Python
- Django
- SQLite

## Como ejecutar el proyecto

1. Crear y activar el entorno virtual:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

2. Instalar dependencias:

```powershell
pip install -r requirements.txt
```

3. Aplicar migraciones:

```powershell
cd teatro_backend
python manage.py migrate
```

4. Crear un superusuario para el admin:

```powershell
python manage.py createsuperuser
```

5. Iniciar el backend:

```powershell
python manage.py runserver
```

## Rutas importantes

- `http://127.0.0.1:8000/` SPA principal servida por Django
- `http://127.0.0.1:8000/backend/` resumen tecnico del backend
- `http://127.0.0.1:8000/eventos/` listado HTML de eventos
- `http://127.0.0.1:8000/api/eventos/` listado JSON para el frontend
- `http://127.0.0.1:8000/admin/` panel de administracion

## Frontend y backend juntos

El proyecto puede usarse de dos maneras:

- Recomendado: abrir `http://127.0.0.1:8000/` para usar la SPA servida por Django.
- Alternativa: abrir `index.html` de forma independiente.

En ambos casos, si Django esta disponible, el frontend intenta consumir automaticamente `/api/eventos/`. Si el backend no esta disponible, la aplicacion usa datos de demostracion para no romper la experiencia.

## Base de datos

Este proyecto no usara MySQL en esta entrega. Se trabaja con SQLite, la base de datos por defecto de Django, para simplificar la configuracion y concentrarse en la logica del sistema.

La documentacion del modelo de datos esta en [docs/arquitectura_bd.md](docs/arquitectura_bd.md).
