# Backend Django

Backend base del sistema de reserva de boletos del Teatro Nacional Eduardo Brito.

## Incluye

- Modelos para `Evento` y `Reserva`
- Usuarios y sesion usando Django Auth
- API JSON tipo REST para eventos y reservas
- Autorizacion por roles para usuarios autenticados y staff
- Vista HTML basica para revisar la cartelera
- Admin de Django para gestionar contenido

## Comandos

```powershell
cd teatro_backend
..\venv\Scripts\python.exe manage.py migrate
..\venv\Scripts\python.exe manage.py createsuperuser
..\venv\Scripts\python.exe manage.py runserver
```

## Rutas

- `/` SPA principal servida por Django
- `/backend/` resumen tecnico del backend
- `/api/config/` configuracion del frontend
- `/eventos/` cartelera HTML
- `/api/eventos/` cartelera JSON
- `/api/eventos/<id>/` detalle y gestion REST de eventos
- `/api/auth/register/` registro con sesion
- `/api/auth/login/` inicio de sesion
- `/api/auth/session/` sesion actual
- `/api/auth/logout/` cierre de sesion
- `/api/reservas/` reservas del usuario autenticado y asientos ocupados por evento
- `/api/reservas/<codigo_reserva>/` detalle y cambio de estado de reservas
- `/admin/` panel administrativo

## Roles

- Publico: consulta eventos publicados y disponibilidad de asientos por evento.
- Usuario autenticado: registra sesion, crea reservas y consulta o cancela sus propias reservas.
- Staff/Admin: administra eventos y puede consultar o actualizar reservas de cualquier usuario.

## Nota de base de datos

En esta entrega se usa SQLite. No se configurara MySQL por ahora.

## Nota de uso

Para probar login, sesion y reservas, usa la app desde `http://127.0.0.1:8000/`. Abrir `index.html` directamente solo sirve para revisar la interfaz y la cartelera de demostracion.
