import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import userRoutes from "./routes/userRoutes.js"
import productRoutes from "./routes/productRoutes.js"
import orderRoutes from "./routes/orderRoutes.js"
import { config } from "./config/config.js"
import paymentRoutes from "./routes/paymentRoutes.js"
import favoritosRouter from './routes/favoritosRoutes.js';
import adminRouter from './routes/adminRoutes.js'
import testRouter from "./routes/testRoutes.js"
import { paymentController } from "./controllers/paymentController.js"


const app = express()

// Middlewares de seguridad
app.use(helmet())
// Configuración de CORS
const allowedOrigins = [
  "http://localhost:3000",
  "https://store-mk.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana por IP
})
app.use(limiter)

// Rutas
app.post("/api/payments/webhook/stripe", express.raw({ type: "application/json" }), paymentController.stripeWebhook);

// Middlewares de parseo (después del webhook de Stripe)
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

app.use("/api/users", userRoutes)
app.use("/api/products", productRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/payments", paymentRoutes)
app.use('/api/favoritos', favoritosRouter)
app.use('/api/admin', adminRouter);
app.use("/api", testRouter)



// Ruta de prueba
app.get("/", (req, res) => {
  res.json({
    message: "API de Tienda funcionando correctamente",
    version: "2.0.0",
    database: "Turso",
    features: ["Autenticación JWT", "Roles de usuario", "CRUD Productos", "Sistema de órdenes", "Integración Stripe"],
  })
})

// Ruta de salud
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() })
})

// Manejo de errores 404
app.use("*", (req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" })
})

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    message: "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && { error: err.message }),
  })
})

const PORT = config.server.port
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
  console.log(`📊 Base de datos: Turso`)
  console.log(`🔐 Autenticación: JWT con roles`)
  console.log(`💳 Pagos: Stripe`)
})
