# Teatro Nacional Eduardo Brito - Reserva de Boletos

Aplicacion web para consultar cartelera, autenticarse y reservar boletos del Teatro Nacional Eduardo Brito. Funciona como una SPA servida por Django en `/`, con backend REST, sesion basada en cookies y assets compilados con Webpack.

## Arquitectura

- Frontend:
  - SPA en JavaScript y jQuery
  - estilos utilitarios con Tailwind CSS compilado
  - bundle generado con Webpack en `teatro_backend/static/dist/`
- Backend:
  - Django 6
  - API JSON tipo REST
  - autenticacion con `django.contrib.auth`
  - SQLite como base de datos local
- Integracion:
  - Django sirve la SPA oficial desde `teatro_backend/templates/index.html`
  - el frontend consume `/api/config/`, `/api/eventos/`, `/api/auth/*` y `/api/reservas/`
  - las peticiones mutables incluyen `X-CSRFToken`

## Estructura principal

```text
.
|-- css/
|-- docs/
|-- frontend/
|   `-- src/
|-- js/
|-- index.html
|-- package.json
|-- postcss.config.js
|-- tailwind.config.js
|-- webpack.config.js
|-- requirements.txt
`-- teatro_backend/
    |-- api/
    |-- static/
    |   `-- dist/
    |-- templates/
    `-- manage.py
```

## Tecnologias

- Django
- API REST
- SPA
- Webpack
- Tailwind CSS
- jQuery
- SQLite
- CSRF
- XSS

## Como ejecutar el proyecto

1. Crear y activar el entorno virtual:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

2. Instalar dependencias de Python:

```powershell
pip install -r requirements.txt
```

3. Instalar dependencias del frontend:

```powershell
npm install
```

4. Aplicar migraciones:

```powershell
cd teatro_backend
..\venv\Scripts\python.exe manage.py migrate
```

5. Compilar los assets del frontend:

```powershell
cd ..
npm run build
```

6. Iniciar Django:

```powershell
cd teatro_backend
..\venv\Scripts\python.exe manage.py runserver
```

## Rutas importantes

- `http://127.0.0.1:8000/`
  - SPA oficial servida por Django
- `http://127.0.0.1:8000/backend/`
  - resumen tecnico del backend
- `http://127.0.0.1:8000/api/config/`
  - configuracion del frontend
- `http://127.0.0.1:8000/api/eventos/`
  - listado JSON de eventos
- `http://127.0.0.1:8000/api/eventos/<id>/`
  - detalle y administracion REST de eventos
- `http://127.0.0.1:8000/api/auth/register/`
  - registro con sesion
- `http://127.0.0.1:8000/api/auth/login/`
  - inicio de sesion
- `http://127.0.0.1:8000/api/auth/session/`
  - sesion actual
- `http://127.0.0.1:8000/api/auth/logout/`
  - cierre de sesion
- `http://127.0.0.1:8000/api/reservas/`
  - reservas del usuario autenticado y asientos ocupados
- `http://127.0.0.1:8000/api/reservas/<codigo_reserva>/`
  - detalle y cambio de estado de una reserva
- `http://127.0.0.1:8000/papasfritas/`
  - panel administrativo de Django


## Build del frontend

Webpack compila el frontend desde `frontend/src/index.js` y genera:

- `teatro_backend/static/dist/app.bundle.js`
- `teatro_backend/static/dist/app.bundle.css`


## Seguridad aplicada

- CSRF:
  - Django emite la cookie `csrftoken`
  - el frontend agrega `X-CSRFToken` en `POST`, `PUT`, `PATCH` y `DELETE`
- XSS:
  - saneamiento de texto y URLs en backend
  - escape adicional de contenido dinamico en frontend

## Accesibilidad y rendimiento

- enlaces de salto al contenido
- focos visibles mejorados
- compatibilidad con `prefers-reduced-motion`
- modales con `role="dialog"` y gestion de foco
- estados vivos con `aria-live`
- selector de asientos con atributos accesibles
- imagenes con `loading="lazy"` y `decoding="async"` donde aplica
- assets compilados y minificados con Webpack

## Documentacion tecnica

- [docs/arquitectura_bd.md](docs/arquitectura_bd.md)
- [teatro_backend/README.md](teatro_backend/README.md)

## Validacion rapida

Pruebas backend:

```powershell
.\venv\Scripts\python.exe .\teatro_backend\manage.py test api
```

Build frontend:

```powershell
npm run build
```