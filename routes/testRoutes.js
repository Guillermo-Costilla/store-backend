import express from "express"
import { enviarCorreo } from "../lib/mailer.js"
import client from "../config/database.js"

const router = express.Router()

router.get("/test-email", async (req, res) => {
  try {
    await enviarCorreo({
      to: "gcostilla96@gmail.com", // o cualquier otro mail de prueba
      subject: "🚀 Prueba de correo desde tu backend",
      html: "<h3>¡Tu backend ya puede enviar correos! 🎉</h3><p>Esto es un mensaje de prueba.</p>",
    })

    res.json({ success: true, message: "Correo enviado correctamente" })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Endpoint de prueba para verificar el servidor
router.get("/test-server", (req, res) => {
  res.json({ 
    success: true, 
    message: "Servidor funcionando correctamente",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Endpoint de prueba para verificar la base de datos
router.get("/test-database", async (req, res) => {
  try {
    const result = await client.execute("SELECT COUNT(*) as count FROM productos")
    res.json({ 
      success: true, 
      message: "Base de datos conectada correctamente",
      productos_count: result.rows[0].count,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    res.status(500).json({ 
      success: false, 
      error: "Error conectando a la base de datos",
      details: error.message 
    })
  }
})

// Endpoint de prueba para verificar CORS
router.get("/test-cors", (req, res) => {
  res.json({ 
    success: true, 
    message: "CORS funcionando correctamente",
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  })
})

// Endpoint de diagnóstico para verificar configuración
router.get("/diagnostic", (req, res) => {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? '✅ Configurada' : '❌ Faltante',
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? '✅ Configurada' : '❌ Faltante',
    JWT_SECRET: process.env.JWT_SECRET ? '✅ Configurada' : '❌ Faltante',
    STRIPE_PRIVATE_KEY: process.env.STRIPE_PRIVATE_KEY ? '✅ Configurada' : '❌ Faltante',
    STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY ? '✅ Configurada' : '❌ Faltante',
    EMAIL_AUTH_USER: process.env.EMAIL_AUTH_USER ? '✅ Configurada' : '❌ Faltante',
    EMAIL_AUTH_PASS: process.env.EMAIL_AUTH_PASS ? '✅ Configurada' : '❌ Faltante',
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

export default router