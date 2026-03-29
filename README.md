# Teatro Nacional Eduardo Brito - Reserva de Boletos

Proyecto academico para una plataforma web de reserva de boletos del Teatro Nacional Eduardo Brito. La solucion actual combina un frontend interactivo en HTML, CSS y JavaScript con un backend basico en Python y Django usando SQLite como base de datos.

## Alcance actual

- SPA en JavaScript con cartelera, detalle de evento, login/registro con sesion de Django, mapa visual de asientos y dashboard.
- Backend Django con modelos para usuarios, eventos y reservas.
- API JSON tipo REST para eventos, autenticacion y reservas, con autorizacion por roles.
- Panel de administracion de Django para gestionar eventos y reservas.
- Documentacion del modelo Entidad-Relacion y de la arquitectura del sistema.

## Semana 4 - Encuentro 1

Este repositorio ya cubre el alcance del primer encuentro de la semana 4:

- API Restful para `eventos` y `reservas`.
- Sistema de autenticacion con registro, login, sesion activa y logout.
- Autorizacion por rol:
  - publico: consulta cartelera publicada.
  - usuario autenticado: crea y consulta sus propias reservas.
  - staff/admin: crea, actualiza y retira eventos; ademas puede consultar y gestionar reservas.

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
- `http://127.0.0.1:8000/api/config/` configuracion del frontend
- `http://127.0.0.1:8000/eventos/` listado HTML de eventos
- `http://127.0.0.1:8000/api/eventos/` listado JSON para el frontend
- `http://127.0.0.1:8000/api/eventos/<id>/` detalle y administracion REST de eventos
- `http://127.0.0.1:8000/api/auth/register/` registro con sesion
- `http://127.0.0.1:8000/api/auth/login/` inicio de sesion
- `http://127.0.0.1:8000/api/auth/session/` sesion actual
- `http://127.0.0.1:8000/api/auth/logout/` cierre de sesion
- `http://127.0.0.1:8000/api/reservas/` reservas del usuario autenticado
- `http://127.0.0.1:8000/api/reservas/<codigo_reserva>/` detalle y cambio de estado de reservas
- `http://127.0.0.1:8000/admin/` panel de administracion

## Frontend y backend juntos

El proyecto puede usarse de dos maneras:

- Recomendado: abrir `http://127.0.0.1:8000/` para usar la SPA servida por Django.
- Alternativa: abrir `index.html` de forma independiente solo para revisar la interfaz y la cartelera de demostracion.

Importante:

- El login, la sesion del usuario y las reservas funcionan correctamente cuando la app se usa desde Django en `http://127.0.0.1:8000/`.
- Si abres `index.html` como archivo independiente, la app puede mostrar la interfaz y datos de demostracion, pero no debe usarse para autenticar usuarios ni crear reservas.
- Si Django no esta disponible, la cartelera usa datos de demostracion para no romper la experiencia visual.

## Base de datos

Este proyecto no usara MySQL en esta entrega. Se trabaja con SQLite, la base de datos por defecto de Django, para simplificar la configuracion y concentrarse en la logica del sistema.

La documentacion del modelo de datos esta en [docs/arquitectura_bd.md](docs/arquitectura_bd.md).
