# Semana 5 - Integracion Completa y Optimizacion

## Objetivo

Consolidar la aplicacion como una solucion web integrada entre frontend y backend, con pipeline de construccion local, mejoras de accesibilidad, optimizacion de assets y documentacion tecnica lista para sustentacion.

## Alcance implementado

- SPA oficial servida por Django desde `/`.
- Frontend compilado con Webpack hacia `teatro_backend/static/dist/`.
- Integracion del frontend con la API REST de autenticacion, eventos, configuracion y reservas.
- Seguridad activa en flujo web:
  - CSRF en peticiones mutantes.
  - saneamiento de texto y URLs para reducir XSS.
- Mejoras de accesibilidad en navegacion, modales, formularios, foco y mensajes dinamicos.
- Optimizacion base de rendimiento mediante empaquetado, minificacion y carga perezosa de imagenes no criticas.

## Arquitectura actual

### Vista general

```text
Navegador
  -> Django Template `/`
  -> app.bundle.css + app.bundle.js
  -> SPA en jQuery/JavaScript
  -> API REST Django `/api/...`
  -> SQLite
```

### Componentes principales

- `teatro_backend/templates/index.html`
  - plantilla oficial de la SPA.
  - expone el contenedor principal y carga los bundles compilados.
- `frontend/src/index.js`
  - punto de entrada del build.
  - registra jQuery global y carga `js/app.js` y los estilos.
- `js/app.js`
  - orquestacion de rutas, fetch a la API, renderizado SPA, autenticacion, reservas, CSRF, XSS y estados UI.
- `webpack.config.js`
  - compila y minifica JavaScript y CSS.
- `teatro_backend/api/`
  - modelos, vistas y pruebas del backend.

## Pipeline de construccion

### Herramientas

- `Webpack`
- `MiniCssExtractPlugin`
- `PostCSS`
- `Tailwind CSS`
- `Autoprefixer`

### Flujo de build

1. `frontend/src/index.js` importa:
   - `jquery`
   - `frontend/src/tailwind.css`
   - `css/styles.css`
   - `js/app.js`
2. Webpack empaqueta el frontend.
3. El resultado se publica en:
   - `teatro_backend/static/dist/app.bundle.js`
   - `teatro_backend/static/dist/app.bundle.css`
4. Django sirve esos assets en la ruta principal `/`.

### Comandos

```powershell
npm install
npm run build
```

Modo observacion:

```powershell
npm run watch
```

## Integracion frontend-backend

### Endpoints consumidos

- `GET /api/config/`
- `GET /api/eventos/`
- `GET /api/eventos/<id>/`
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `GET /api/auth/session/`
- `POST /api/auth/logout/`
- `GET /api/reservas/`
- `POST /api/reservas/`

### Flujo de autenticacion

1. Django sirve la SPA con cookie `csrftoken`.
2. El frontend lee la cookie y agrega `X-CSRFToken` en `POST`, `PUT`, `PATCH` y `DELETE`.
3. Login y registro crean sesion de Django.
4. La SPA consulta `/api/auth/session/` para restaurar la sesion al recargar.

### Ejemplo de reserva

```json
{
  "event_id": 1,
  "seats": ["A1", "A2"]
}
```

Respuesta esperada:

```json
{
  "mensaje": "Reserva creada correctamente",
  "reserva": {
    "codigo_reserva": "ABC123",
    "estado": "confirmada"
  }
}
```

## Seguridad aplicada

### CSRF

- La vista principal entrega cookie CSRF.
- El frontend adjunta `X-CSRFToken` en cada peticion mutante same-origin.
- El backend rechaza peticiones sin token con `403 Forbidden`.

### XSS

- El backend limpia texto plano y normaliza URLs sospechosas.
- El frontend escapa texto dinamico antes de inyectarlo en HTML.
- Las imagenes pasan por validacion de protocolo antes de renderizarse.

### Palabras clave

- `CSRF`
- `XSS`
- `same-origin`
- `sanitize`
- `escapeHtml`
- `session authentication`

## Accesibilidad implementada

### Navegacion

- enlace "Saltar al contenido principal".
- `aria-expanded` y `aria-hidden` en menu movil.
- `aria-current="page"` en la ruta activa.

### Contenido dinamico

- `aria-live` para mensajes de estado.
- region anunciadora para cambios de vista.
- `aria-busy` en el contenedor principal durante render.

### Modales y foco

- `role="dialog"` y `aria-modal="true"`.
- foco inicial controlado al abrir.
- cierre con `Escape`.
- ciclo de foco dentro del modal.

### Formularios y asientos

- `autocomplete` en registro/login.
- resumen de compra con `role="status"`.
- botones de asiento con `aria-label`, `aria-pressed` y `aria-disabled`.

## Optimizacion aplicada

### Rendimiento

- bundle unico minificado para JS y CSS.
- eliminacion de dependencias CDN en la version oficial.
- `loading="lazy"` y `decoding="async"` en imagenes no criticas.
- `prefers-reduced-motion` para reducir animaciones.

### Mantenibilidad

- punto de entrada unico del frontend.
- assets compilados dentro del flujo normal de Django.
- separacion entre demo estatica y version oficial servida por backend.

## Rutas operativas

- `/` SPA oficial
- `/backend/` resumen tecnico HTML del backend
- `/eventos/` vista HTML auxiliar
- `/api/...` API REST
- `/papasfritas/` panel administrativo

## Verificacion tecnica recomendada

### Backend

```powershell
.\venv\Scripts\python.exe .\teatro_backend\manage.py test api
```

### Frontend

```powershell
npm run build
```

### Ejecucion local

```powershell
cd .\teatro_backend
..\venv\Scripts\python.exe manage.py runserver
```

Abrir:

- `http://127.0.0.1:8000/`

## Limitaciones conocidas

- La SPA sigue concentrada en un solo archivo principal (`js/app.js`), aunque ya entra a produccion mediante bundler.
- La demo raiz `index.html` existe para referencia visual, pero la experiencia funcional completa se valida en `/`.
- La base de datos continua en SQLite para simplificar la entrega academica.

## Palabras clave para sustentacion

- `SPA`
- `Django`
- `Webpack`
- `Tailwind CSS`
- `jQuery`
- `API REST`
- `Session Authentication`
- `CSRF`
- `XSS`
- `Accessibility`
- `Performance Optimization`
- `Bundling`
- `Static Assets`
- `QA`
