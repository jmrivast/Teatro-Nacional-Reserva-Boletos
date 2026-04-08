# Teatro Nacional Eduardo Brito - Reserva de Boletos

Este proyecto es una aplicacion web para consultar la cartelera del Teatro Nacional Eduardo Brito, registrarse, iniciar sesion y reservar boletos en linea. La propuesta combina una experiencia de usuario tipo SPA en el frontend con un backend en Django que expone la informacion y gestiona la logica de autenticacion, eventos, reservas y seguridad.

El trabajo fue realizado por Jose Manuel Rivas y Yira Tavarez.

## Vision general del proyecto

La aplicacion fue pensada para resolver un flujo muy concreto: que un usuario pueda entrar al sitio, ver los eventos disponibles, autenticarse y completar una reserva de manera sencilla y segura. En lugar de separar frontend y backend en proyectos completamente distintos, se opto por una integracion directa con Django para mantener la entrega mas ordenada, controlada y facil de ejecutar.

La experiencia final busca dar una sensacion moderna y fluida. El usuario no tiene que navegar entre multiples paginas completas para cada accion, sino que interactua con una SPA que consume datos del backend y actualiza la interfaz de forma dinamica. Esto permite que la cartelera, el inicio de sesion, el detalle del evento y el dashboard de reservas se sientan como una sola aplicacion conectada.

## Que hace la aplicacion

La solucion cubre un flujo funcional completo de reserva de boletos:

- Consulta de eventos publicados en cartelera.
- Visualizacion del detalle de cada evento.
- Registro e inicio de sesion de usuarios.
- Persistencia de sesion con cookies.
- Reserva de asientos para eventos disponibles.
- Visualizacion de reservas realizadas por el usuario.
- Panel administrativo en `/papasfritas/` para gestion interna del sistema.

En terminos academicos, el proyecto demuestra integracion real entre cliente y servidor, manejo de seguridad web en operaciones autenticadas, consumo de API REST, organizacion de assets compilados y una estructura que puede crecer con cambios relativamente controlados.

## Arquitectura general

La aplicacion sigue una arquitectura web integrada:

- El backend fue desarrollado en Django.
- Django sirve la aplicacion principal desde `/`.
- El frontend funciona como una SPA en JavaScript.
- La SPA consume endpoints JSON para eventos, autenticacion, configuracion y reservas.
- Los archivos estaticos del frontend se compilan con Webpack y se sirven desde `teatro_backend/static/dist/`.

Esta decision fue importante porque evita tener dos despliegues distintos para una entrega de curso. El mismo proyecto controla el render inicial, la API, la sesion, los assets compilados y la capa administrativa. Eso reduce complejidad operativa y facilita la puesta en marcha local.

## Tecnologias utilizadas y por que se eligieron

### Django

Django fue elegido como framework principal del backend porque ofrece una base muy completa para aplicaciones web que necesitan autenticacion, administracion, manejo de sesiones, ORM y una estructura solida desde el inicio. En este proyecto fue especialmente valioso porque permitio avanzar rapido sin sacrificar orden.

Se eligio Django sobre alternativas mas ligeras porque el proyecto no solo necesitaba responder JSON. Tambien hacia falta:

- autenticacion de usuarios,
- middleware de seguridad,
- validacion del lado del servidor,
- panel administrativo,
- integracion clara con base de datos,
- y una arquitectura estable para una entrega academica.

En ese sentido, Django aporto mucho mas valor inmediato que una solucion mas minimalista.

### JavaScript con jQuery

El frontend esta hecho en JavaScript y se apoya en jQuery para el manejo del DOM, eventos y peticiones asincronas. La eleccion de jQuery no fue por moda ni por intentar competir con frameworks modernos como React o Vue, sino por conveniencia tecnica dentro del contexto del proyecto.

Se eligio jQuery porque:

- el proyecto necesitaba una SPA ligera, no una aplicacion compleja basada en componentes,
- permite manipular la interfaz de forma rapida y clara,
- reduce codigo repetitivo en eventos, selectores y actualizaciones de la UI,
- y encajaba bien con la escala real del sistema.

Usar React o Vue habria sido valido, pero tambien habria agregado mas complejidad estructural, mas tiempo de configuracion y una curva adicional que no era necesaria para el objetivo actual. Aqui jQuery cumplio una funcion practica: hacer que la interfaz fuera dinamica sin obligar a introducir una arquitectura de frontend mucho mas pesada.

### Tailwind CSS

Tailwind CSS se eligio para el estilado porque permite construir interfaces visualmente consistentes con mucha velocidad y control. En lugar de depender de componentes prediseñados, se trabaja con utilidades que permiten ajustar el layout, el espaciado, la tipografia, los colores y los estados con precision.

Se prefirio Tailwind sobre Bootstrap por varias razones:

- Bootstrap acelera mucho el desarrollo, pero trae estilos y componentes con una identidad visual muy marcada.
- En este proyecto se queria conservar un look mas propio, mas cercano a la imagen del teatro y menos generico.
- Tailwind da mas libertad para personalizar sin tener que pelear tanto contra estilos predefinidos.
- Tambien ayuda a mantener consistencia si se define bien la paleta y las convenciones del proyecto.

En otras palabras, Bootstrap habria sido util para una maqueta funcional rapida, pero Tailwind fue mejor opcion para conseguir una apariencia mas controlada y menos estandarizada.

### Webpack

Webpack se incorporo para profesionalizar el manejo del frontend. Antes, la aplicacion podia funcionar cargando archivos sueltos desde el HTML, pero eso deja mas dependencia en recursos externos y menos control sobre la salida final. Con Webpack se construye un pipeline de build que toma el JavaScript, el CSS y las dependencias del frontend, y genera archivos finales optimizados.

Se eligio Webpack porque:

- permite empaquetar el frontend en bundles listos para produccion,
- minifica y optimiza los assets,
- centraliza dependencias como jQuery,
- facilita compilar Tailwind y CSS en una salida controlada,
- y deja una estructura mas escalable para futuras mejoras.

Su aporte principal en este proyecto no fue solo rendimiento, sino orden. Webpack hace que el frontend deje de depender de varias inclusiones manuales y pase a tener una salida unificada, versionable y mas consistente.

### SQLite

SQLite se utilizo como base de datos local por ser suficiente para la escala actual del proyecto y por su facilidad de configuracion. Para una entrega academica y para pruebas locales, ofrece una ventaja clara: se puede ejecutar el sistema rapidamente sin instalar y administrar un motor mas pesado.

Eso no significa que la arquitectura este atada a SQLite para siempre. La estructura del proyecto, al estar basada en Django ORM, facilita migrar mas adelante a PostgreSQL u otra base de datos relacional si el proyecto creciera en volumen, concurrencia o necesidades de analitica.

## Por que el proyecto funciona bien como solucion integrada

Una de las fortalezas del sistema es que frontend y backend no estan peleados entre si. Se comunican bien porque fueron pensados como partes de una misma aplicacion:

- Django sirve la SPA oficial.
- La SPA consume endpoints bien definidos.
- La sesion del usuario se mantiene con cookies.
- Los formularios y acciones de reserva no dependen de hacks ni de procesos manuales.
- El flujo desde cartelera hasta reserva tiene continuidad.

Esto hace que el sistema sea mas facil de entender, probar y mantener. Tambien evita muchas fricciones tipicas de proyectos donde frontend y backend avanzan por caminos totalmente distintos.

## Seguridad aplicada

La seguridad fue una parte importante del proyecto, especialmente porque el sistema maneja autenticacion, datos de usuario y operaciones de reserva.

### Proteccion contra CSRF

CSRF es un tipo de ataque en el que un tercero intenta forzar al navegador del usuario autenticado a enviar una accion no deseada al servidor. Esto es especialmente delicado cuando se trabaja con sesiones basadas en cookies, porque el navegador envia esas cookies automaticamente.

La solucion aplicada fue aprovechar el mecanismo nativo de Django para CSRF. Conceptualmente, el sistema funciona asi:

- el servidor entrega al navegador un token CSRF valido,
- el frontend toma ese token y lo incluye en las peticiones que modifican estado,
- y el backend verifica que el token recibido sea legitimo antes de aceptar la operacion.

De esa forma, aunque un usuario tenga una sesion activa, no basta con disparar una peticion desde cualquier sitio externo. La accion necesita venir acompañada por la verificacion CSRF correcta.

En terminos practicos, esto protege operaciones sensibles como:

- registro autenticado con sesion,
- cierre de sesion,
- y creacion de reservas.

### Proteccion contra XSS

XSS ocurre cuando un atacante intenta introducir codigo malicioso en campos de texto para que luego se renderice o ejecute en el navegador de otro usuario. En una aplicacion con contenido dinamico, esto es especialmente importante.

La solucion se aplico en dos niveles:

- del lado del backend, limpiando y normalizando texto antes de procesarlo o devolverlo;
- y del lado del frontend, escapando contenido dinamico antes de insertarlo en la interfaz.

La idea no fue solamente "bloquear etiquetas", sino tratar el contenido del usuario como texto, no como HTML ejecutable. Con eso se evita que un nombre, descripcion o cualquier entrada manipulada termine convirtiendose en codigo activo dentro de la pagina.

Este enfoque por capas es importante porque no depende de una sola barrera. Si una entrada riesgosa intenta atravesar el sistema, se encuentra con controles tanto en el servidor como en la interfaz.

### Proteccion contra SQL Injection

SQL Injection ocurre cuando una aplicacion construye consultas SQL de forma insegura a partir de texto enviado por el usuario. Si eso se hace concatenando cadenas manualmente, se abre la puerta a alterar la consulta original.

En este proyecto se redujo ese riesgo utilizando Django ORM como via principal de comunicacion con la base de datos. Eso significa que la aplicacion no depende de armar consultas SQL crudas a mano para las operaciones normales del sistema. En lugar de eso, se trabaja con modelos, filtros y operaciones del ORM, que abstraen la consulta y manejan correctamente los valores enviados.

La decision importante aqui no fue solo usar una tecnologia distinta, sino elegir una forma de trabajo mas segura:

- validacion del lado del servidor,
- consultas a traves del ORM,
- y ausencia de concatenacion manual de SQL en la logica principal.

Esto disminuye mucho la superficie de riesgo frente a inyeccion SQL y vuelve la capa de datos mas mantenible.

## Como se resolvio la seguridad sin complicar la experiencia

Un punto fuerte del proyecto es que las medidas de seguridad no se implementaron como un obstaculo para el usuario. Se integraron dentro del flujo normal de la aplicacion:

- el usuario navega la SPA de forma natural,
- el token CSRF se gestiona como parte de la comunicacion segura,
- las entradas se limpian sin romper la experiencia,
- y la base de datos se consulta de manera controlada.

Eso es importante porque un sistema no se vuelve mejor por tener mas controles visibles, sino por tener controles correctos que funcionen sin volver la experiencia torpe o frágil.

## Eficiencia del proyecto

Aunque el sistema esta pensado para un alcance academico, tiene varias decisiones que mejoran eficiencia y orden tecnico:

- La SPA evita recargas completas innecesarias entre vistas.
- El backend entrega datos en formato JSON para actualizar la interfaz de manera puntual.
- Webpack genera assets minificados y listos para servir.
- El frontend y el backend estan integrados dentro de una misma solucion, lo que simplifica el arranque y la prueba local.
- Django ofrece una base robusta para autenticacion, validacion y administracion sin reinventar piezas comunes.

La eficiencia aqui no se limita al rendimiento visual. Tambien se refleja en productividad de desarrollo, facilidad de despliegue local y claridad de mantenimiento.

## Escalabilidad

El proyecto tambien tiene una base razonable para crecer. No es un sistema masivo todavia, pero su arquitectura permite evolucionar sin tener que rehacerlo desde cero.

Hay varios puntos que ayudan a esa escalabilidad:

- Separacion clara entre interfaz, logica del servidor y acceso a datos.
- Endpoints REST que permiten reutilizar la logica con otros clientes si fuera necesario.
- Uso de ORM, lo que facilita migrar la base de datos a un motor mas robusto.
- Pipeline de build con Webpack, que permite seguir profesionalizando el frontend.
- Organizacion de assets estaticos lista para futuras optimizaciones.

Si el proyecto necesitara crecer, se podria avanzar hacia:

- una base de datos como PostgreSQL,
- despliegue en un entorno productivo mas formal,
- cache para ciertas consultas,
- y una modularizacion mayor del frontend.

Lo importante es que la estructura actual ya apunta en esa direccion.

## Build del frontend con Webpack

Uno de los avances mas importantes de la integracion fue pasar de una carga mas manual del frontend a un proceso de build.

Webpack toma el punto de entrada del frontend, incorpora dependencias y hojas de estilo, y genera una salida final dentro de `teatro_backend/static/dist/`. Esto trae varias ventajas:

- centraliza el frontend en una salida controlada,
- mejora la organizacion del proyecto,
- reduce dependencia de inclusiones manuales,
- permite minificacion para produccion,
- y deja preparado el terreno para seguir creciendo.

En este proyecto, Webpack no esta por estar. Su valor real es que convierte una SPA funcional en un frontend mejor empaquetado, mas limpio de servir y mas serio desde el punto de vista tecnico.

## Por que el proyecto es una buena solucion

Este proyecto es una buena solucion porque logra equilibrio. No intenta ser mas complejo de lo necesario, pero tampoco se queda en una maqueta superficial. Tiene:

- una experiencia de usuario funcional y conectada,
- backend real con autenticacion y reservas,
- medidas de seguridad aplicadas con criterio,
- build moderno para el frontend,
- estructura ordenada,
- y posibilidades reales de crecimiento.

Tambien tiene valor academico porque demuestra que se entendieron conceptos importantes de desarrollo web moderno:

- integracion cliente-servidor,
- consumo de API,
- autenticacion y autorizacion,
- seguridad web,
- organizacion de assets,
- y despliegue de una experiencia completa.

## Estructura principal del proyecto

```text
.
|-- css/
|-- docs/
|-- frontend/
|   `-- src/
|-- js/
|-- index.html
|-- package.json
|-- package-lock.json
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

## Rutas importantes

- `http://127.0.0.1:8000/`
  - SPA oficial servida por Django.
- `http://127.0.0.1:8000/backend/`
  - vista tecnica informativa del backend.
- `http://127.0.0.1:8000/api/config/`
  - configuracion de la aplicacion.
- `http://127.0.0.1:8000/api/eventos/`
  - listado JSON de eventos.
- `http://127.0.0.1:8000/api/auth/register/`
  - registro de usuario.
- `http://127.0.0.1:8000/api/auth/login/`
  - inicio de sesion.
- `http://127.0.0.1:8000/api/auth/session/`
  - consulta de sesion actual.
- `http://127.0.0.1:8000/api/auth/logout/`
  - cierre de sesion.
- `http://127.0.0.1:8000/api/reservas/`
  - reservas del usuario autenticado.
- `http://127.0.0.1:8000/papasfritas/`
  - panel administrativo de Django.

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

## Validacion recomendada

Para validar rapidamente la parte backend y la integracion principal:

```powershell
.\venv\Scripts\python.exe .\teatro_backend\manage.py test api
```

Y para regenerar el frontend compilado:

```powershell
npm run build
```

## Cierre

En conjunto, este proyecto representa una aplicacion web completa, integrada y bien fundamentada para la reserva de boletos del Teatro Nacional Eduardo Brito. La seleccion de tecnologias no se hizo por tendencia, sino por equilibrio entre rapidez de desarrollo, claridad estructural, seguridad, mantenibilidad y potencial de crecimiento.

Mas que una suma de herramientas, el resultado es una solucion coherente: una interfaz dinamica, un backend confiable, medidas de seguridad bien planteadas y una base tecnica que puede seguir evolucionando.
