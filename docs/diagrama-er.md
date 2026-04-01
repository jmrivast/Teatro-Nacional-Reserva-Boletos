# Diagrama Entidad-Relacion

## Modelo de base de datos actual

```mermaid
erDiagram
    AUTH_USER ||--o{ RESERVA : realiza
    EVENTO ||--o{ RESERVA : recibe

    AUTH_USER {
        bigint id PK
        string username UK
        string first_name
        string last_name
        string email
        string password
        boolean is_staff
        boolean is_active
        datetime date_joined
    }

    EVENTO {
        bigint id PK
        string titulo
        text descripcion
        date fecha
        time hora
        decimal precio
        string imagen
        string categoria
        boolean publicado
    }

    RESERVA {
        bigint id PK
        bigint usuario_id FK
        bigint evento_id FK
        string codigo_reserva
        string asientos
        decimal total_pagado
        string estado
        datetime fecha_reserva
    }
```

## Estructura base

- `Usuarios`: se reutiliza `auth_user` de Django.
- `Eventos`: cartelera disponible, categoria, precio, fecha y estado de publicacion.
- `Reservas`: relaciona un usuario con un evento, registra asientos, total pagado y estado.

## Nota tecnica

- En esta entrega, `asientos` se guarda como texto separado por comas para mantener el backend simple.
- Si luego quieren bloqueo real de butacas, conviene crear tablas separadas para `Asiento` y `ReservaAsiento`.
