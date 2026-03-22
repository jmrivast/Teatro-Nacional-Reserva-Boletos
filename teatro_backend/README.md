# Backend Django

Backend base del sistema de reserva de boletos del Teatro Nacional Eduardo Brito.

## Incluye

- Modelos para `Evento` y `Reserva`
- Usuarios usando Django Auth
- API JSON para listar eventos
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
- `/eventos/` cartelera HTML
- `/api/eventos/` cartelera JSON
- `/admin/` panel administrativo

## Nota de base de datos

En esta entrega se usa SQLite. No se configurara MySQL por ahora.
