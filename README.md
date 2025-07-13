# API Store Backend

## Descripción

Esta API RESTful permite gestionar una tienda online, incluyendo usuarios, productos, órdenes, pagos, favoritos y métricas administrativas. Está construida en Node.js y utiliza una base de datos SQL (Turso/LibSQL). Incluye autenticación JWT y pagos con Stripe.

---

## URL Base de la API

> **Producción:**
>
> https://store-backend-pied.vercel.app/api

Utiliza esta URL como base para todas las peticiones a los endpoints.

---

## Tabla de Contenidos

- [Instalación](#instalación)
- [Configuración](#configuración)
- [Estructura de la Base de Datos](#estructura-de-la-base-de-datos)
- [Autenticación](#autenticación)
- [Endpoints de la API](#endpoints-de-la-api)
  - [Usuarios](#usuarios)
  - [Productos](#productos)
  - [Órdenes](#órdenes)
  - [Pagos](#pagos)
  - [Favoritos](#favoritos)
  - [Admin](#admin)
  - [Test](#test)
- [Ejemplo de Uso](#ejemplo-de-uso)
- [Notas y Recomendaciones](#notas-y-recomendaciones)

---

## Instalación

1. Clona el repositorio:
   ```bash
   git clone <url-del-repo>
   cd store-backend-1
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura las variables de entorno en un archivo `.env` en la raíz:
   ```env
   TURSO_DATABASE_URL=...
   TURSO_AUTH_TOKEN=...
   JWT_SECRET=...
   STRIPE_PRIVATE_KEY=...
   STRIPE_PUBLIC_KEY=...
   EMAIL_AUTH_USER=...
   EMAIL_AUTH_PASS=...
   PORT=5000
   ```
4. Inicia el servidor:
   ```bash
   npm start
   ```

---

## Configuración

- El archivo `config/config.js` gestiona la configuración de la base de datos, JWT, Stripe y correo electrónico.
- El archivo `config/database.js` crea el cliente de conexión a la base de datos.
- El script `scripts/setup-database-enhanced.js` crea y mejora la estructura de la base de datos.

---

## Estructura de la Base de Datos (actualizada)

### Tabla: `usuarios`

| Campo          | Tipo | Descripción                            |
| -------------- | ---- | -------------------------------------- |
| id             | TEXT | Identificador único (UUID, string)     |
| nombre         | TEXT | Nombre del usuario                     |
| email          | TEXT | Email (único)                          |
| contraseña     | TEXT | Contraseña hasheada                    |
| pais           | TEXT | País (por defecto 'Argentina')         |
| localidad      | TEXT | Localidad (por defecto 'Buenos Aires') |
| codigo_postal  | TEXT | Código postal (por defecto '1000')     |
| rol            | TEXT | 'usuario' o 'admin'                    |
| fecha_creacion | TEXT | Fecha de creación (ISO string)         |

### Tabla: `productos`

| Campo            | Tipo    | Descripción                                      |
| ---------------- | ------- | ------------------------------------------------ |
| id               | TEXT    | Identificador único (UUID, string)               |
| nombre           | TEXT    | Nombre del producto                              |
| categoria        | TEXT    | Categoría                                        |
| imagen           | TEXT    | URL de la imagen principal                       |
| imagenes         | TEXT    | Array JSON de URLs de imágenes adicionales       |
| descripcion      | TEXT    | Descripción                                      |
| precio           | DECIMAL | Precio original                                  |
| descuento        | DECIMAL | Descuento aplicado (%)                           |
| precio_descuento | DECIMAL | Precio con descuento (calculado automáticamente) |
| puntuacion       | DECIMAL | Puntuación promedio                              |
| stock            | INTEGER | Stock disponible                                 |
| views            | INTEGER | Cantidad de visualizaciones                      |
| fecha_creacion   | TEXT    | Fecha de creación (ISO string)                   |

### Tabla: `ordenes`

| Campo                    | Tipo    | Descripción                                                            |
| ------------------------ | ------- | ---------------------------------------------------------------------- |
| id                       | TEXT    | Identificador único (UUID, string)                                     |
| usuario_id               | TEXT    | ID del usuario                                                         |
| total                    | DECIMAL | Total de la orden                                                      |
| estado                   | TEXT    | Estado ('pendiente_envio', 'enviado', 'cancelado')                     |
| pago                     | TEXT    | Estado de pago ('pendiente', 'pagado', 'cancelado')                    |
| productos                | TEXT    | Array JSON de productos (id, nombre, precio, cantidad, subtotal, etc.) |
| stripe_payment_intent_id | TEXT    | ID de PaymentIntent de Stripe                                          |
| direccion                | TEXT    | Dirección de envío                                                     |
| localidad                | TEXT    | Localidad de envío                                                     |
| provincia                | TEXT    | Provincia de envío                                                     |
| codigo_postal            | TEXT    | Código postal de envío                                                 |
| fecha_creacion           | TEXT    | Fecha de creación (ISO string)                                         |

### Tabla: `favoritos`

| Campo          | Tipo | Descripción                        |
| -------------- | ---- | ---------------------------------- |
| id             | TEXT | Identificador único (UUID, string) |
| usuario_id     | TEXT | ID del usuario                     |
| producto_id    | TEXT | ID del producto                    |
| fecha_creacion | TEXT | Fecha de creación (ISO string)     |

### Índices y mejoras

- Índices en email de usuarios, categoría y descuento de productos, views, precio_descuento, usuario y estado en órdenes.
- El campo `imagenes` en productos es un array JSON de hasta 3 imágenes.
- El campo `descuento` es un porcentaje (0-50%) y `precio_descuento` se calcula automáticamente.
- El campo `views` permite saber cuántas veces fue visto un producto.
- El campo `fecha_creacion` es un string ISO (no DATETIME SQL).
- Los IDs son UUIDs (strings), no enteros autoincrementales.

### Usuario admin por defecto

- Email: `admin@tienda.com`
- Contraseña: `password123`

---

## Autenticación

- Se utiliza JWT. Para acceder a rutas protegidas, debes enviar el token en el header:
  ```http
  Authorization: Bearer <token>
  ```
- El token se obtiene al hacer login.

---

## Endpoints de la API

> **Recuerda:** Todos los endpoints deben ser llamados usando la URL base de producción: `https://store-backend-pied.vercel.app/api`

### Usuarios

- **POST /users/register**
  - Crea un usuario.
  - Body JSON:
    ```json
    {
      "nombre": "Juan",
      "email": "juan@mail.com",
      "password": "123456",
      "pais": "Argentina", // opcional
      "localidad": "Buenos Aires", // opcional
      "codigo_postal": "1000" // opcional
    }
    ```
- **POST /users/login**
  - Inicia sesión y devuelve un token JWT.
  - Body JSON:
    ```json
    {
      "email": "juan@mail.com",
      "password": "123456"
    }
    ```
- **GET /users/profile** (protegido)
  - Devuelve el perfil del usuario autenticado.
- **PUT /users/profile** (protegido)
  - Actualiza el perfil del usuario autenticado.
  - Body JSON:
    ```json
    {
      "nombre": "Juan",
      "email": "juan@mail.com",
      "pais": "Argentina",
      "localidad": "Buenos Aires",
      "codigo_postal": "1000"
    }
    ```

### Productos

- **GET /products/**
  - Lista todos los productos disponibles.
  - Query params opcionales: `categoria`, `limit`, `offset`
- **GET /products/categories**
  - Lista todas las categorías disponibles.
- **GET /products/:id**
  - Devuelve un producto por su ID.
- **POST /products/** (admin)
  - Crea un producto.
  - Body JSON:
    ```json
    {
      "nombre": "Remera",
      "categoria": "Ropa",
      "imagen": "https://...",
      "imagenes": ["https://...", "https://...", "https://..."],
      "descripcion": "Remera 100% algodón",
      "precio": 2500,
      "descuento": 10,
      "stock": 10
    }
    ```
- **PUT /products/:id** (admin)
  - Actualiza un producto.
  - Body igual al de creación, más `puntuacion` (opcional).
- **DELETE /products/:id** (admin)
  - Elimina un producto.

### Órdenes

- **POST /orders/** (protegido)
  - Crea una orden.
  - Body JSON:
    ```json
    {
      "productos": [
        { "producto_id": "uuid1", "cantidad": 2 },
        { "producto_id": "uuid2", "cantidad": 1 }
      ],
      "direccion": "Av. Corrientes 1234",
      "localidad": "Buenos Aires",
      "provincia": "Buenos Aires",
      "codigo_postal": "1043"
    }
    ```
- **GET /orders/my-orders** (protegido)
  - Devuelve las órdenes del usuario autenticado.
- **GET /orders/all** (admin)
  - Devuelve todas las órdenes (admin).
- **PUT /orders/:id/status** (admin)
  - Actualiza el estado o pago de una orden.
  - Body JSON:
    ```json
    {
      "estado": "enviado", // o 'pendiente_envio', 'cancelado'
      "pago": "pagado" // o 'pendiente', 'cancelado'
    }
    ```
- **POST /orders/confirm-payment**
  - Confirma el pago de una orden (usado por Stripe).
- **POST /orders/webhook/stripe**
  - Webhook para eventos de Stripe.

### Pagos

- **POST /payments/process-payment**
  - Procesa un pago con Stripe.
  - Body JSON:
    ```json
    {
      "token": "tok_xxx",
      "amount": 5000,
      "currency": "usd",
      "description": "Compra de productos",
      "items": [ ... ],
      "customer": { "email": "juan@mail.com", "name": "Juan" }
    }
    ```
- **POST /payments/create-payment-intent**
  - Crea un PaymentIntent de Stripe.
  - Body JSON:
    ```json
    {
      "amount": 5000,
      "currency": "usd",
      "items": [ ... ],
      "customer": { "email": "juan@mail.com", "name": "Juan" }
    }
    ```
- **POST /payments/confirm-payment**
  - Confirma un pago que requiere confirmación adicional.
  - Body JSON:
    ```json
    {
      "payment_intent_id": "pi_xxx",
      "payment_method_id": "pm_xxx"
    }
    ```
- **GET /payments/payment-status/:payment_intent_id**
  - Obtiene el estado actual de un pago.
- **GET /payments/public-key**
  - Devuelve la clave pública de Stripe.

#### Manejo de errores de pago

**Error común: `"status": "requires_payment_method"`**

Este error indica que el método de pago fue rechazado o necesita información adicional. Para solucionarlo:

1. **Verificar los datos de la tarjeta:**

   - Asegúrate de que el número de tarjeta sea correcto
   - Verifica la fecha de vencimiento
   - Confirma el código CVV
   - Usa una tarjeta de prueba válida de Stripe

2. **Tarjetas de prueba recomendadas:**

   - **Visa:** `4242424242424242`
   - **Mastercard:** `5555555555554444`
   - **Código CVV:** `123`
   - **Fecha de vencimiento:** Cualquier fecha futura

3. **Flujo de manejo en el frontend:**
   ```javascript
   // Ejemplo de manejo del error
   fetch("/api/payments/process-payment", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify(paymentData),
   })
     .then((response) => response.json())
     .then((data) => {
       if (data.success) {
         // Pago exitoso
         console.log("Pago completado:", data.payment_intent);
       } else if (data.code === "PAYMENT_METHOD_REJECTED") {
         // Mostrar mensaje al usuario para que use otra tarjeta
         alert(
           "La tarjeta fue rechazada. Por favor, intenta con otra tarjeta."
         );
       } else {
         // Otro tipo de error
         alert("Error en el pago: " + data.error);
       }
     });
   ```

### Favoritos

- **POST /favoritos/**
  - Agrega un producto a favoritos.
  - Body JSON:
    ```json
    {
      "usuario_id": "uuid_usuario",
      "producto_id": "uuid_producto"
    }
    ```
- **DELETE /favoritos/**
  - Elimina un producto de favoritos.
  - Body igual al de agregar.
- **GET /favoritos/:usuario_id**
  - Devuelve los productos favoritos de un usuario.

### Admin

- **GET /admin/dashboard** (admin)

  - Devuelve métricas administrativas:
    - Total de ventas
    - Total de órdenes
    - Órdenes por estado
    - Productos más vendidos
    - Productos con stock bajo
    - Órdenes recientes con información del cliente y dirección de envío

- **GET /admin/orders** (admin)

  - Devuelve todas las órdenes con información completa:
    - Datos del cliente (nombre, email, país, localidad)
    - Dirección de envío completa
    - Productos de la orden
    - Estado y pago
  - Query params opcionales: `limit`, `offset`, `estado`, `pago`

- **GET /admin/orders/:id** (admin)
  - Devuelve una orden específica con información detallada:
    - Información completa del cliente
    - Dirección de envío
    - Productos detallados
    - Historial de estados

### Test

- **GET /test/test-email**
  - Envía un correo de prueba (para desarrollo).

---

## Ejemplo de Uso

### Registro de usuario

```bash
curl -X POST https://store-backend-pied.vercel.app/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan","email":"juan@mail.com","password":"123456"}'
```

### Login y obtención de token

```bash
curl -X POST https://store-backend-pied.vercel.app/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@mail.com","password":"123456"}'
```

### Crear producto (admin)

```bash
curl -X POST https://store-backend-pied.vercel.app/api/products/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token_admin>" \
  -d '{"nombre":"Remera","categoria":"Ropa","imagen":"https://...","imagenes":["https://...","https://...","https://..."],"descripcion":"Remera 100% algodón","precio":2500,"descuento":10,"stock":10}'
```

### Crear orden con datos de envío

```bash
curl -X POST https://store-backend-pied.vercel.app/api/orders/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token_usuario>" \
  -d '{
    "productos": [
      { "producto_id": "uuid1", "cantidad": 2 },
      { "producto_id": "uuid2", "cantidad": 1 }
    ],
    "direccion": "Av. Corrientes 1234",
    "localidad": "Buenos Aires",
    "provincia": "Buenos Aires",
    "codigo_postal": "1043"
  }'
```

### Ver órdenes completas (admin)

```bash
curl -X GET https://store-backend-pied.vercel.app/api/admin/orders \
  -H "Authorization: Bearer <token_admin>"
```

### Ver orden específica (admin)

```bash
curl -X GET https://store-backend-pied.vercel.app/api/admin/orders/orden_id \
  -H "Authorization: Bearer <token_admin>"
```

#### Ejemplo de respuesta del dashboard mejorado:

```json
{
  "success": true,
  "metricas": {
    "ventas": {
      "total": 17912.59,
      "ultimo_mes": 8500.0
    },
    "ordenes": {
      "total": 16,
      "por_estado": [{ "estado": "pendiente_envio", "cantidad": 16 }],
      "por_pago": [
        { "pago": "pagado", "cantidad": 10 },
        { "pago": "pendiente", "cantidad": 6 }
      ],
      "recientes": [
        {
          "id": "orden-uuid-1",
          "total": 2500.0,
          "estado": "pendiente_envio",
          "pago": "pagado",
          "fecha_creacion": "2024-01-15T10:30:00Z",
          "direccion": "Av. Corrientes 1234",
          "localidad": "Buenos Aires",
          "provincia": "Buenos Aires",
          "codigo_postal": "1043",
          "cliente_nombre": "Juan Pérez",
          "cliente_email": "juan@mail.com",
          "cliente_pais": "Argentina"
        }
      ]
    },
    "productos": {
      "total": 25,
      "stock_bajo": [
        {
          "id": "prod-uuid-1",
          "nombre": "Remera",
          "stock": 2,
          "precio": 2500.0
        }
      ]
    }
  }
}
```

#### Ejemplo de respuesta de órdenes completas:

```json
{
  "success": true,
  "ordenes": [
    {
      "id": "orden-uuid-1",
      "usuario_id": "user-uuid-1",
      "total": 2500.0,
      "estado": "pendiente_envio",
      "pago": "pagado",
      "productos": [
        {
          "id": "prod-uuid-1",
          "nombre": "Remera",
          "precio": 2500.0,
          "cantidad": 1,
          "subtotal": 2500.0
        }
      ],
      "stripe_payment_intent_id": "pi_xxx",
      "fecha_creacion": "2024-01-15T10:30:00Z",
      "cliente": {
        "nombre": "Juan Pérez",
        "email": "juan@mail.com",
        "pais": "Argentina",
        "localidad": "Buenos Aires",
        "codigo_postal": "1000"
      },
      "direccion_envio": {
        "direccion": "Av. Corrientes 1234",
        "localidad": "Buenos Aires",
        "provincia": "Buenos Aires",
        "codigo_postal": "1043"
      }
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

---

## Notas y Recomendaciones

- Para rutas protegidas, siempre enviar el token JWT en el header `Authorization`.
- Los endpoints de admin requieren que el usuario tenga rol `admin`.
- Los pagos se procesan con Stripe, asegúrate de tener las claves configuradas.
- El sistema de favoritos requiere que el usuario y producto existan.
- El webhook de Stripe debe ser configurado en el dashboard de Stripe para producción.
- El endpoint de test-email es solo para pruebas de envío de correo.
- El script de setup crea un usuario admin por defecto.
- Los IDs de todas las tablas son UUIDs (strings), no enteros.
- Los campos de fecha son strings ISO, no DATETIME SQL.
- Los productos pueden tener hasta 3 imágenes (campo imagenes).
- Los descuentos y precios con descuento se calculan automáticamente.

---

## Autor

- Desarrollado por Guillermo Costilla.

---

## Acceso a paneles de admin desde el frontend

### 1. Autenticación y obtención de token

El frontend debe autenticar al usuario mediante `/users/login`. El backend devolverá un token JWT. Este token debe guardarse (por ejemplo, en localStorage o cookies seguras).

### 2. Envío del token en las peticiones

Para acceder a cualquier endpoint de admin, el frontend debe enviar el token en el header:

```
Authorization: Bearer <token>
```

### 3. Verificación de permisos en el frontend

- El frontend debe decodificar el token JWT (puede usar librerías como `jwt-decode`) para verificar que el usuario tiene el campo `rol: "admin"`.
- Si el usuario no es admin, debe ocultar o bloquear el acceso a los paneles de administración.

### 4. Manejo de errores de acceso

- Si el backend responde con `401 Unauthorized` (token inválido o no enviado), el frontend debe redirigir al login.
- Si responde con `403 Forbidden` (no es admin), debe mostrar un mensaje de acceso denegado.

### 5. Endpoints de admin disponibles

- **GET `/admin/dashboard`**  
  Devuelve métricas administrativas (ventas, órdenes, productos más vendidos, etc.).

- **POST `/products/`**, **PUT `/products/:id`**, **DELETE `/products/:id`**  
  Crear, actualizar o eliminar productos.

- **GET `/orders/all`**  
  Listar todas las órdenes.

- **PUT `/orders/:id/status`**  
  Actualizar el estado o pago de una orden.

### 6. Ejemplo de flujo desde el frontend

```js
// Ejemplo en React usando fetch
const token = localStorage.getItem("token");

fetch("https://store-backend-pied.vercel.app/api/admin/dashboard", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
  .then((res) => {
    if (res.status === 401) throw new Error("No autenticado");
    if (res.status === 403) throw new Error("Acceso denegado");
    return res.json();
  })
  .then((data) => {
    // Mostrar métricas en el panel admin
  })
  .catch((err) => {
    // Redirigir o mostrar mensaje de error
  });
```

### 7. Notas adicionales

- El backend ya valida el rol admin en los endpoints críticos.
- El frontend debe gestionar la sesión y el rol para mostrar u ocultar los paneles de administración.
- El usuario admin por defecto es:  
  Email: `admin@tienda.com`  
  Contraseña: `password`
