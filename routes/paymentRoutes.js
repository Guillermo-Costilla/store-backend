import express from "express"
import { paymentController } from "../controllers/paymentController.js"

const router = express.Router()

// Rutas de pago con Stripe
router.post("/process-payment", paymentController.processPayment)
router.post("/create-payment-intent", paymentController.createPaymentIntent)
router.get("/public-key", paymentController.getPublicKey)

// Webhook de Stripe
router.post("/webhook/stripe", paymentController.stripeWebhook)

export default router
