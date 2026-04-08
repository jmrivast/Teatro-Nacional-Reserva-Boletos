# Backend Django

Backend principal del sistema de reserva de boletos del Teatro Nacional Eduardo Brito. Esta carpeta contiene la aplicacion Django que sirve la SPA oficial, expone la API REST y gestiona sesiones, eventos y reservas.

## Responsabilidades

- servir la SPA principal desde `/`
- exponer la API JSON de configuracion, eventos, autenticacion y reservas
- manejar sesiones y permisos por rol
- servir los assets compilados del frontend desde `static/dist/`

## Comandos principales

```powershell
cd teatro_backend
..\venv\Scripts\python.exe manage.py migrate
..\venv\Scripts\python.exe manage.py createsuperuser
..\venv\Scripts\python.exe manage.py runserver
..\venv\Scripts\python.exe manage.py test api
```

## Flujo recomendado

```powershell
cd ..
npm run build
cd teatro_backend
..\venv\Scripts\python.exe manage.py runserver
```

## Rutas operativas

- `/` SPA oficial servida por Django
- `/backend/` resumen tecnico del backend
- `/eventos/` cartelera HTML auxiliar
- `/api/config/` configuracion consumida por la SPA
- `/api/eventos/` lista REST de eventos
- `/api/auth/register/` registro
- `/api/auth/login/` login
- `/api/auth/session/` sesion actual
- `/api/auth/logout/` logout
- `/api/reservas/` listado y creacion de reservas
- `/api/reservas/<codigo_reserva>/` detalle y actualizacion de reservas
- `/papasfritas/` panel administrativo

## Documentacion relacionada

- [Arquitectura y base de datos](../docs/arquitectura_bd.md)
