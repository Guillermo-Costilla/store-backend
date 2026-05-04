# 🛒 Store API — Backend

API REST para ecommerce con flujo completo de compra,
incluyendo autenticación, gestión de órdenes y pagos online con Stripe.

Diseñada para simular un flujo real de compra con autenticación, procesamiento de pagos y panel administrativo.

---

## 🚀 Demo

🔗 https://store-backend-pied.vercel.app/api

---

## ⚙️ Funcionalidades principales

- 🔐 Autenticación con JWT
- 👤 Gestión de usuarios
- 🛍️ Catálogo de productos
- 📦 Creación y gestión de órdenes
- 💳 Pagos integrados con Stripe
- ❤️ Sistema de favoritos
- 📊 Panel administrativo con métricas

---

## 💳 Flujo de compra

```text
Usuario se registra
→ navega productos
→ crea orden
→ realiza pago (Stripe)
→ orden se confirma automáticamente
→ recibe mail de confirmación de compra con detalles de la misma
```

---

## 🛠 Stack

- Node.js + Express  
- LibSQL (Turso)  
- JWT (autenticación)  
- Stripe (pagos)  
- Nodemailer (emails)  

---

## 🧱 Arquitectura

```text
config/
controllers/
routes/
services/
middlewares/
scripts/
```
Estructura modular enfocada en escalabilidad.

---

## 🔐 Seguridad

- Autenticación JWT en rutas protegidas
- Control de roles (admin / usuario)
- Validación de datos en backend
- Protección de rutas con middleware
- Manejo seguro de pagos con Stripe Webhooks

---

## 📦 Endpoints destacados

- `POST /users/login`
- `GET /products`
- `POST /orders`
- `POST /payments/process-payment`
- `GET /admin/dashboard`

---

## ⚡ Instalación

```bash
npm install
npm start
````

Configurar .env:
```text
JWT_SECRET=...
STRIPE_PRIVATE_KEY=...
DATABASE_URL=...
```
---

## 🧠 Qué demuestra este proyecto

- Integración de pagos reales con Stripe
- Manejo de órdenes y lógica de ecommerce
- Diseño de API REST completa
- Seguridad en autenticación y pagos
- Arquitectura backend escalable

---

## 📌 Alcance (v1.0)

Esta API permite ejecutar el flujo completo de compra de un ecommerce:

- registro e inicio de sesión de usuarios
- navegación de productos
- creación de órdenes
- procesamiento de pagos
- gestión administrativa

Futuras versiones incluirán mejoras y nuevas funcionalidades.

## 👨‍💻 Autor

Guillermo Costilla — Full Stack Developer
