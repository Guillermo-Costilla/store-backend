import Stripe from "stripe"
import { config } from "../config/config.js"

const stripe = new Stripe(config.stripe.privateKey)

export const paymentController = {
  // Procesar pago
  async processPayment(req, res) {
    try {
      const { amount, currency = "usd", description, payment_method_id } = req.body

      // Crear Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convertir a centavos
        currency,
        description: description || "Pago de tienda",
        payment_method: payment_method_id,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
      })

      res.json({
        success: true,
        payment_intent: paymentIntent,
        client_secret: paymentIntent.client_secret,
      })
    } catch (error) {
      console.error("Error en el proceso de pago:", error)
      res.status(400).json({
        success: false,
        error: error.message,
      })
    }
  },

  // Crear Payment Intent
  async createPaymentIntent(req, res) {
    try {
      const { amount, currency = "usd", metadata = {} } = req.body

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      })

      res.json({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      })
    } catch (error) {
      console.error("Error creando Payment Intent:", error)
      res.status(400).json({
        success: false,
        error: error.message,
      })
    }
  },

  // Obtener clave pública de Stripe
  async getPublicKey(req, res) {
    res.json({
      public_key: config.stripe.publicKey,
    })
  },
}
