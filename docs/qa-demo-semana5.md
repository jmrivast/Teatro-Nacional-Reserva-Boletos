# QA y Demostracion - Semana 5

## Objetivo

Validar que la aplicacion este completamente integrada, funcional y lista para demostracion tecnica.

## Preparacion del entorno

### Instalar dependencias

```powershell
pip install -r requirements.txt
npm install
```

### Construir assets

```powershell
npm run build
```

### Levantar Django

```powershell
cd .\teatro_backend
..\venv\Scripts\python.exe manage.py migrate
..\venv\Scripts\python.exe manage.py runserver
```

## Checklist funcional

### Cartelera

- Abrir `http://127.0.0.1:8000/`.
- Confirmar que la portada carga sin errores.
- Entrar a `Cartelera`.
- Abrir el detalle de un evento.

Resultado esperado:

- la SPA responde por hash routing.
- los eventos llegan desde `/api/eventos/`.

### Registro y login

- Ir a `Iniciar Sesion`.
- Crear una cuenta nueva.
- Cerrar sesion.
- Volver a iniciar sesion con el mismo usuario.

Resultado esperado:

- la sesion se restaura con `/api/auth/session/`.
- el dashboard muestra el nombre del usuario autenticado.

### Reservas

- Entrar al detalle de un evento.
- Seleccionar uno o varios asientos.
- Confirmar compra.
- Ir a `Mis Reservas`.

Resultado esperado:

- el resumen de compra se actualiza.
- la reserva se guarda en backend.
- el modal de confirmacion aparece correctamente.

### Admin

- Abrir `/papasfritas/`.
- Confirmar acceso con superusuario.
- Crear o editar un evento.

Resultado esperado:

- el evento queda disponible en la SPA cuando este publicado.

## Checklist de seguridad

### CSRF

Probar una peticion mutante sin token:

```powershell
Invoke-WebRequest `
  -Uri "http://127.0.0.1:8000/api/auth/register/" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"name":"SinToken","email":"sintoken@example.com","password":"ClaveSegura123!"}'
```

Resultado esperado:

- respuesta `403`.

Probar con token valido:

```powershell
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Invoke-WebRequest `
  -Uri "http://127.0.0.1:8000/" `
  -WebSession $session | Out-Null

$token = $session.Cookies.GetCookies("http://127.0.0.1:8000")["csrftoken"].Value

Invoke-WebRequest `
  -Uri "http://127.0.0.1:8000/api/auth/register/" `
  -WebSession $session `
  -Method Post `
  -ContentType "application/json" `
  -Headers @{ "X-CSRFToken" = $token } `
  -Body '{"name":"ConToken","email":"contoken@example.com","password":"ClaveSegura123!"}'
```

Resultado esperado:

- la peticion es aceptada.

### XSS

Campo de prueba:

```text
<script>alert(1)</script> Jose
```

Resultado esperado:

- no se ejecuta JavaScript.
- el texto se limpia antes de renderizarse.

## Checklist de accesibilidad

- Probar el enlace "Saltar al contenido principal".
- Navegar con teclado en menu movil.
- Abrir y cerrar modales con `Escape`.
- Confirmar foco visible en botones y enlaces.
- Revisar que el resumen de compra anuncie cambios.
- Probar `prefers-reduced-motion` en el navegador.

## Pruebas tecnicas

### Backend

```powershell
.\venv\Scripts\python.exe .\teatro_backend\manage.py test api
```

### Build

```powershell
npm run build
```

## Guion corto para la demostracion

1. Mostrar la arquitectura:
   - Django sirve la SPA.
   - Webpack compila los assets.
   - la SPA consume API REST.
2. Mostrar autenticacion:
   - registro.
   - login.
   - restauracion de sesion.
3. Mostrar compra:
   - seleccion de asientos.
   - reserva.
   - dashboard.
4. Mostrar seguridad:
   - CSRF bloqueando una peticion sin token.
   - saneamiento XSS.
5. Mostrar optimizacion:
   - assets compilados en `static/dist`.
   - mejoras de accesibilidad y foco.

## Evidencias sugeridas

- captura de la SPA en `/`.
- captura del dashboard con reservas.
- captura de `Network` mostrando `X-CSRFToken`.
- captura de `npm run build`.
- captura de `manage.py test api`.
