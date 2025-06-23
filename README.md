# 🛒 API de Tienda - Backend con Turso y Stripe

Una API REST completa para e-commerce construida con Node.js, Express, Turso (SQLite) y Stripe para pagos.

## 🚀 Características

- ✅ **Base de datos Turso** (SQLite en la nube)
- ✅ **Autenticación JWT** con roles de usuario
- ✅ **CRUD completo** de productos y órdenes
- ✅ **Integración con Stripe** para pagos
- ✅ **Sistema de roles** (Admin/Usuario)
- ✅ **Seguridad avanzada** (Helmet, CORS, Rate Limiting)
- ✅ **25 productos precargados** con imágenes reales
- ✅ **Webhooks de Stripe** para confirmación de pagos

## 📋 Tabla de Contenidos

- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Credenciales de Admin](#-credenciales-de-admin)
- [Rutas de Usuarios](#-rutas-de-usuarios)
- [Rutas de Productos](#-rutas-de-productos)
- [Rutas de Órdenes](#-rutas-de-órdenes)
- [Rutas de Pagos](#-rutas-de-pagos-stripe)
- [Webhooks](#-webhooks)
- [Rutas de Sistema](#-rutas-de-sistema)
- [Códigos de Error](#-códigos-de-error)
- [Roles y Permisos](#-roles-y-permisos)
- [Seguridad](#-seguridad)
- [Testing](#-testing)
- [Despliegue](#-despliegue)

## 🛠️ Instalación

### Prerrequisitos

- Node.js 18+
- Cuenta en [Turso](https://turso.tech)
- Cuenta en [Stripe](https://stripe.com)

### Pasos de Instalación

1. **Clonar el repositorio**
   \`\`\`bash
   git clone <repository-url>
   cd tienda-backend-turso
   \`\`\`

2. **Instalar dependencias**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configurar variables de entorno**
   \`\`\`bash
   cp .env.example .env

# Editar .env con tus credenciales

\`\`\`

4. **Crear y poblar la base de datos**
   \`\`\`bash

# Ejecutar scripts SQL en tu dashboard de Turso

# O usar el CLI de Turso para ejecutar los scripts

\`\`\`

5. **Iniciar el servidor**
   \`\`\`bash

# Desarrollo

npm run dev

# Producción

npm start
\`\`\`

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

\`\`\`env

# Base de datos Turso

TURSO_DATABASE_URL=libsql://your-database-url.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# JWT

JWT_SECRET=your-super-secret-jwt-key-here

# Stripe

STRIPE_PRIVATE_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLIC_KEY=pk_test_your-stripe-public-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Servidor

PORT=5000
NODE_ENV=development

# Frontend URL (para webhooks y redirects)

FRONTEND_URL=http://localhost:3000
\`\`\`

### Configuración de Turso

1. Crea una cuenta en [Turso](https://turso.tech)
2. Crea una nueva base de datos
3. Obtén la URL y el token de autenticación
4. Ejecuta los scripts SQL para crear las tablas

### Configuración de Stripe

1. Crea una cuenta en [Stripe](https://stripe.com)
2. Obtén las claves API del dashboard
3. Configura un webhook endpoint apuntando a `/api/orders/webhook/stripe`
4. Copia el secret del webhook

## 🔑 Credenciales de Admin

**Usuario administrador predefinido:**

- **Email**: `admin@tienda.com`
- **Contraseña**: `password123`
- **Rol**: `admin`

## 👥 Rutas de Usuarios

### Registro de Usuario

\`\`\`http
POST /api/users/register
Content-Type: application/json
\`\`\`

**Body:**
\`\`\`json
{
"nombre": "Juan Pérez",
"email": "juan@email.com",
"password": "password123",
"pais": "Argentina",
"localidad": "Buenos Aires",
"codigo_postal": "1000"
}
\`\`\`

**Respuesta:**
\`\`\`json
{
"message": "Usuario registrado exitosamente"
}
\`\`\`

### Login

\`\`\`http
POST /api/users/login
Content-Type: application/json
\`\`\`

**Body:**
\`\`\`json
{
"email": "juan@email.com",
"password": "password123"
}
\`\`\`

**Respuesta:**
\`\`\`json
{
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
"user": {
"id": "user-123",
"email": "juan@email.com",
"nombre": "Juan Pérez",
"rol": "usuario",
"pais": "Argentina",
"localidad": "Buenos Aires",
"codigo_postal": "1000"
}
}
\`\`\`

### Obtener Perfil

\`\`\`http
GET /api/users/profile
Authorization: Bearer <token>
\`\`\`

**Respuesta:**
\`\`\`json
{
"id": "user-123",
"nombre": "Juan Pérez",
"email": "juan@email.com",
"pais": "Argentina",
"localidad": "Buenos Aires",
"codigo_postal": "1000",
"rol": "usuario"
}
\`\`\`

### Actualizar Perfil

\`\`\`http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json
\`\`\`

**Body:**
\`\`\`json
{
"nombre": "Juan Carlos Pérez",
"email": "juancarlos@email.com",
"pais": "Argentina",
"localidad": "Córdoba",
"codigo_postal": "5000"
}
\`\`\`

## 📦 Rutas de Productos

### Listar Productos (Público)

\`\`\`http
GET /api/products
\`\`\`

**Query Parameters:**

- `categoria` (opcional): Filtrar por categoría
- `limit` (opcional): Número de productos (default: 50)
- `offset` (opcional): Paginación (default: 0)

**Ejemplo:**
\`\`\`http
GET /api/products?categoria=Electrónicos&limit=10&offset=0
\`\`\`

**Respuesta:**
\`\`\`json
[
{
"id": "prod-123",
"nombre": "iPhone 14 Pro Max",
"categoria": "Electrónicos",
"imagen": "https://images.unsplash.com/...",
"descripcion": "El iPhone más avanzado...",
"precio": 1299.99,
"puntuacion": 4.8,
"stock": 25,
"fecha_creacion": "2024-01-15T10:30:00Z"
}
]
\`\`\`

### Obtener Producto por ID (Público)

\`\`\`http
GET /api/products/:id
\`\`\`

**Respuesta:**
\`\`\`json
{
"id": "prod-123",
"nombre": "iPhone 14 Pro Max",
"categoria": "Electrónicos",
"imagen": "https://images.unsplash.com/...",
"descripcion": "El iPhone más avanzado...",
"precio": 1299.99,
"puntuacion": 4.8,
"stock": 25,
"fecha_creacion": "2024-01-15T10:30:00Z"
}
\`\`\`

### Obtener Categorías (Público)

\`\`\`http
GET /api/products/categories
\`\`\`

**Respuesta:**
\`\`\`json
[
"Electrónicos",
"Computadoras",
"Audio",
"Gaming",
"Ropa",
"Deportes"
]
\`\`\`

### Crear Producto (Solo Admin)

\`\`\`http
POST /api/products
Authorization: Bearer <admin_token>
Content-Type: application/json
\`\`\`

**Body:**
\`\`\`json
{
"nombre": "Nuevo Producto",
"categoria": "Electrónicos",
"imagen": "https://example.com/imagen.jpg",
"descripcion": "Descripción del producto",
"precio": 299.99,
"stock": 50
}
\`\`\`

### Actualizar Producto (Solo Admin)

\`\`\`http
PUT /api/products/:id
Authorization: Bearer <admin_token>
Content-Type: application/json
\`\`\`

**Body:**
\`\`\`json
{
"nombre": "Producto Actualizado",
"categoria": "Electrónicos",
"imagen": "https://example.com/nueva-imagen.jpg",
"descripcion": "Nueva descripción",
"precio": 349.99,
"stock": 30,
"puntuacion": 4.5
}
\`\`\`

### Eliminar Producto (Solo Admin)

\`\`\`http
DELETE /api/products/:id
Authorization: Bearer <admin_token>
\`\`\`

## 🛒 Rutas de Órdenes

### Crear Orden

\`\`\`http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json
\`\`\`

**Body:**
\`\`\`json
{
"productos": [
{
"producto_id": "prod-123",
"cantidad": 2
},
{
"producto_id": "prod-456",
"cantidad": 1
}
]
}
\`\`\`

**Respuesta:**
\`\`\`json
{
"message": "Orden creada exitosamente",
"orden_id": "order-789",
"total": 2899.97,
"client_secret": "pi_1234567890_secret_abcdef",
"payment_intent_id": "pi_1234567890"
}
\`\`\`

### Obtener Mis Órdenes

\`\`\`http
GET /api/orders/my-orders
Authorization: Bearer <token>
\`\`\`

**Query Parameters:**

- `limit` (opcional): Número de órdenes (default: 10)
- `offset` (opcional): Paginación (default: 0)

**Respuesta:**
\`\`\`json
[
{
"id": "order-789",
"usuario_id": "user-123",
"total": 2899.97,
"estado": "pendiente_envio",
"pago": "pagado",
"stripe_payment_intent_id": "pi_1234567890",
"fecha_creacion": "2024-01-15T14:30:00Z",
"productos": [
{
"id": "prod-123",
"nombre": "iPhone 14 Pro Max",
"precio": 1299.99,
"cantidad": 2,
"subtotal": 2599.98
}
]
}
]
\`\`\`

### Obtener Todas las Órdenes (Solo Admin)

\`\`\`http
GET /api/orders/all
Authorization: Bearer <admin_token>
\`\`\`

**Query Parameters:**

- `limit` (opcional): Número de órdenes (default: 50)
- `offset` (opcional): Paginación (default: 0)
- `estado` (opcional): Filtrar por estado
- `pago` (opcional): Filtrar por estado de pago

**Ejemplo:**
\`\`\`http
GET /api/orders/all?estado=pendiente_envio&pago=pagado&limit=20
\`\`\`

**Respuesta:**
\`\`\`json
[
{
"id": "order-789",
"usuario_id": "user-123",
"usuario_nombre": "Juan Pérez",
"usuario_email": "juan@email.com",
"total": 2899.97,
"estado": "pendiente_envio",
"pago": "pagado",
"productos": [...],
"fecha_creacion": "2024-01-15T14:30:00Z"
}
]
\`\`\`

### Actualizar Estado de Orden (Solo Admin)

\`\`\`http
PUT /api/orders/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json
\`\`\`

**Body:**
\`\`\`json
{
"estado": "enviado",
"pago": "pagado"
}
\`\`\`

**Estados válidos:**

- **Estado de envío**: `pendiente_envio`, `enviado`, `cancelado`
- **Estado de pago**: `pendiente`, `pagado`, `cancelado`

### Confirmar Pago

\`\`\`http
POST /api/orders/confirm-payment
Content-Type: application/json
\`\`\`

**Body:**
\`\`\`json
{
"payment_intent_id": "pi_1234567890"
}
\`\`\`

## 💳 Rutas de Pagos (Stripe)

### Crear Payment Intent

\`\`\`http
POST /api/payments/create-payment-intent
Content-Type: application/json
\`\`\`

**Body:**
\`\`\`json
{
"amount": 299.99,
"currency": "usd",
"metadata": {
"orden_id": "order-789",
"usuario_id": "user-123"
}
}
\`\`\`

**Respuesta:**
\`\`\`json
{
"client_secret": "pi_1234567890_secret_abcdef",
"payment_intent_id": "pi_1234567890"
}
\`\`\`

### Procesar Pago Directo

\`\`\`http
POST /api/payments/process-payment
Content-Type: application/json
\`\`\`

**Body:**
\`\`\`json
{
"amount": 299.99,
"currency": "usd",
"description": "Compra en tienda",
"payment_method_id": "pm_1234567890"
}
\`\`\`

### Obtener Clave Pública de Stripe

\`\`\`http
GET /api/payments/public-key
\`\`\`

**Respuesta:**
\`\`\`json
{
"public_key": "pk_test_1234567890abcdef"
}
\`\`\`

## 🔗 Webhooks

### Webhook de Stripe

\`\`\`http
POST /api/orders/webhook/stripe
\`\`\`

Este endpoint recibe notificaciones automáticas de Stripe cuando cambia el estado de un pago.

**Headers requeridos:**
\`\`\`
stripe-signature: <signature>
\`\`\`

## 📊 Rutas de Sistema

### Estado de la API

\`\`\`http
GET /
\`\`\`

**Respuesta:**
\`\`\`json
{
"message": "API de Tienda funcionando correctamente",
"version": "2.0.0",
"database": "Turso",
"features": [
"Autenticación JWT",
"Roles de usuario",
"CRUD Productos",
"Sistema de órdenes",
"Integración Stripe"
]
}
\`\`\`

### Health Check

\`\`\`http
GET /health
\`\`\`

**Respuesta:**
\`\`\`json
{
"status": "OK",
"timestamp": "2024-01-15T16:45:30.123Z"
}
\`\`\`

## 🚨 Códigos de Error

| Código | Descripción                    |
| ------ | ------------------------------ |
| `200`  | Éxito                          |
| `201`  | Creado exitosamente            |
| `400`  | Solicitud incorrecta           |
| `401`  | No autorizado (token inválido) |
| `403`  | Prohibido (sin permisos)       |
| `404`  | No encontrado                  |
| `429`  | Demasiadas solicitudes         |
| `500`  | Error interno del servidor     |

## 🔒 Roles y Permisos

### Usuario Normal (`usuario`)

- ✅ Ver productos
- ✅ Crear órdenes
- ✅ Ver sus propias órdenes
- ✅ Actualizar su perfil
- ❌ Gestionar productos
- ❌ Ver todas las órdenes

### Administrador (`admin`)

- ✅ Todas las funciones de usuario
- ✅ Crear/editar/eliminar productos
- ✅ Ver todas las órdenes
- ✅ Actualizar estado de órdenes
- ✅ Acceso completo al sistema

## 🛡️ Seguridad

### Headers de Seguridad

- **Helmet**: Headers de seguridad HTTP
- **CORS**: Control de acceso entre dominios
- **Rate Limiting**: 100 requests por 15 minutos por IP

### Autenticación

- **JWT**: Tokens con expiración de 24 horas
- **bcrypt**: Hash de contraseñas con salt rounds 10
- **Roles**: Sistema de permisos basado en roles

### Validación

- **Joi**: Validación de esquemas de datos
- **Sanitización**: Limpieza de inputs
- **SQL Injection**: Protección con prepared statements

## 🗄️ Estructura de Base de Datos

### Usuarios

\`\`\`sql
usuarios (
id TEXT PRIMARY KEY,
nombre TEXT NOT NULL,
email TEXT UNIQUE NOT NULL,
contraseña TEXT NOT NULL,
pais TEXT NOT NULL,
localidad TEXT NOT NULL,
codigo_postal TEXT NOT NULL,
rol TEXT DEFAULT 'usuario',
fecha_creacion TEXT NOT NULL
)
\`\`\`

### Productos

\`\`\`sql
productos (
id TEXT PRIMARY KEY,
nombre TEXT NOT NULL,
categoria TEXT NOT NULL,
imagen TEXT NOT NULL,
descripcion TEXT NOT NULL,
precio DECIMAL(10,2) NOT NULL,
puntuacion DECIMAL(2,1) DEFAULT 0,
stock INTEGER NOT NULL DEFAULT 0,
fecha_creacion TEXT NOT NULL
)
\`\`\`

### Órdenes

\`\`\`sql
ordenes (
id TEXT PRIMARY KEY,
usuario_id TEXT NOT NULL,
total DECIMAL(10,2) NOT NULL,
estado TEXT DEFAULT 'pendiente_envio',
pago TEXT DEFAULT 'pendiente',
productos TEXT NOT NULL, -- JSON
stripe_payment_intent_id TEXT,
fecha_creacion TEXT NOT NULL
)
\`\`\`

## 🧪 Testing

### Postman Collection

Crea una nueva colección en Postman con estas configuraciones:

**Variables de entorno:**
\`\`\`json
{
"base_url": "http://localhost:5000/api",
"jwt_token": "",
"admin_token": ""
}
\`\`\`

**Configuración de autorización:**
\`\`\`json
{
"type": "bearer",
"bearer": [
{
"key": "token",
"value": "{{jwt_token}}",
"type": "string"
}
]
}
\`\`\`

### Flujo de Testing

1. **Login como admin**
   \`\`\`http
   POST {{base_url}}/users/login
   \`\`\`

2. **Crear productos**
   \`\`\`http
   POST {{base_url}}/products
   \`\`\`

3. **Registrar usuario normal**
   \`\`\`http
   POST {{base_url}}/users/register
   \`\`\`

4. **Crear orden**
   \`\`\`http
   POST {{base_url}}/orders
   \`\`\`

5. **Procesar pago**
   \`\`\`http
   POST {{base_url}}/payments/create-payment-intent
   \`\`\`

## 🚦 Estados de Orden

### Estado de Envío

- `pendiente_envio` - Orden creada, pendiente de envío
- `enviado` - Orden enviada
- `cancelado` - Orden cancelada

### Estado de Pago

- `pendiente` - Pago pendiente
- `pagado` - Pago confirmado
- `cancelado` - Pago cancelado/rechazado

## 💳 Integración con Stripe

El sistema está integrado con Stripe para procesamiento de pagos:

1. **Crear orden** - El usuario crea una orden
2. **Generar Payment Intent** - Se crea un Payment Intent en Stripe
3. **Procesar pago** - El usuario paga a través de Stripe Elements
4. **Webhook** - Stripe notifica el estado del pago
5. **Actualizar orden** - Se actualiza el estado de pago en la orden

## 📈 Monitoreo

### Logs

Los logs se muestran en consola con información de:

- Requests HTTP
- Errores de base de datos
- Eventos de Stripe
- Autenticación fallida

### Métricas

- Rate limiting por IP
- Tiempo de respuesta
- Errores por endpoint

## 🚀 Despliegue

### Variables de Producción

\`\`\`env
NODE*ENV=production
TURSO_DATABASE_URL=libsql://prod-database.turso.io
STRIPE_PRIVATE_KEY=sk_live*...
STRIPE*PUBLIC_KEY=pk_live*...
FRONTEND_URL=https://tu-dominio.com
\`\`\`

### Docker (Opcional)

\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package\*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
\`\`\`

### Docker Compose

\`\`\`yaml
version: '3.8'
services:
api:
build: .
ports: - "5000:5000"
environment: - NODE_ENV=production - TURSO_DATABASE_URL=${TURSO_DATABASE_URL}
      - TURSO_AUTH_TOKEN=${TURSO_AUTH_TOKEN} - JWT_SECRET=${JWT_SECRET}
      - STRIPE_PRIVATE_KEY=${STRIPE_PRIVATE_KEY}
restart: unless-stopped
\`\`\`

## 📦 Productos Precargados

El sistema incluye 25 productos variados en español:

- **Electrónicos**: iPhone, Samsung Galaxy, etc.
- **Computadoras**: MacBook, Dell XPS, etc.
- **Audio**: Sony WH-1000XM5, AirPods Pro, etc.
- **Gaming**: PlayStation 5, Nintendo Switch, etc.
- **Ropa**: Levi's, Patagonia, etc.
- **Deportes**: Adidas, Nike, etc.

Todos con imágenes reales optimizadas de Unsplash.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para soporte técnico o preguntas:

- 📧 Email: soporte@tienda.com
- 💬 Discord: [Servidor de la comunidad]
- 📚 Documentación: [Wiki del proyecto]

## 🔧 Dependencias Principales

\`\`\`json
{
"@libsql/client": "^0.4.0",
"bcrypt": "^5.1.1",
"cors": "^2.8.5",
"express": "^4.18.2",
"express-rate-limit": "^7.1.5",
"helmet": "^7.1.0",
"jsonwebtoken": "^9.0.2",
"stripe": "^14.9.0"
}
\`\`\`

## 🎯 Roadmap

- [ ] Implementar cache con Redis
- [ ] Agregar sistema de reviews
- [ ] Implementar notificaciones push
- [ ] Agregar sistema de cupones
- [ ] Implementar analytics avanzados
- [ ] Agregar soporte para múltiples idiomas

---

**Desarrollado con ❤️ usando Node.js, Express, Turso y Stripe**
