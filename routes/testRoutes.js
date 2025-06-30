import express from "express"
import { enviarCorreo } from "../lib/mailer.js"

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

export default router