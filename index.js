import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"

const app = express()

// Middlewares de seguridad
app.use(helmet())

// Configuración de CORS simplificada
app.use(cors({
  origin: true, // Permitir todos los orígenes temporalmente
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana por IP
})
app.use(limiter)

// Middlewares de parseo
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Ruta de prueba simple
app.get("/", (req, res) => {
  res.json({
    message: "API de Tienda funcionando correctamente",
    version: "2.0.0",
    status: "OK",
    timestamp: new Date().toISOString()
  })
})

// Ruta de salud
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Ruta de diagnóstico
app.get("/diagnostic", (req, res) => {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? '✅ Configurada' : '❌ Faltante',
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? '✅ Configurada' : '❌ Faltante',
    JWT_SECRET: process.env.JWT_SECRET ? '✅ Configurada' : '❌ Faltante',
  }

  res.json({
    success: true,
    message: "Diagnóstico del servidor",
    environment: envVars,
    timestamp: new Date().toISOString(),
    headers: {
      origin: req.headers.origin,
      'user-agent': req.headers['user-agent']
    }
  })
})

// Cargar rutas de forma estática
try {
  // Importar rutas
  const userRoutes = (await import("./routes/userRoutes.js")).default
  const productRoutes = (await import("./routes/productRoutes.js")).default
  const orderRoutes = (await import("./routes/orderRoutes.js")).default
  const paymentRoutes = (await import("./routes/paymentRoutes.js")).default
  const favoritosRouter = (await import('./routes/favoritosRoutes.js')).default
  const adminRouter = (await import('./routes/adminRoutes.js')).default
  const testRouter = (await import("./routes/testRoutes.js")).default
  const { paymentController } = await import("./controllers/paymentController.js")

  // Configurar rutas
  app.use("/api/users", userRoutes)
  app.use("/api/products", productRoutes)
  app.use("/api/orders", orderRoutes)
  app.use("/api/payments", paymentRoutes)
  app.use('/api/favoritos', favoritosRouter)
  app.use('/api/admin', adminRouter)
  app.use("/api", testRouter)

  // Webhook de Stripe (especial)
  app.post("/api/payments/webhook/stripe", express.raw({ type: "application/json" }), paymentController.stripeWebhook)

  console.log('✅ Rutas cargadas correctamente')
} catch (error) {
  console.error('❌ Error cargando rutas:', error)
  
  // Ruta de fallback para cuando hay errores
  app.use("/api/*", (req, res) => {
    res.status(500).json({ 
      error: "Error interno del servidor - Rutas no disponibles",
      message: error.message 
    })
  })
}

// Manejo de errores 404
app.use("*", (req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" })
})

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error del servidor:', err)
  res.status(500).json({
    message: "Error interno del servidor",
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  })
})

const PORT = process.env.PORT || 5000

// Solo iniciar el servidor si no estamos en Vercel (serverless)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
    console.log(`📊 Base de datos: Turso`)
    console.log(`🔐 Autenticación: JWT con roles`)
    console.log(`💳 Pagos: Stripe`)
  })
}

// Exportar para Vercel serverless
export default app

