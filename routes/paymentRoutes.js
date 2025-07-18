import express from "express"
import { paymentController } from "../controllers/paymentController.js"

const router = express.Router()

// Rutas de pago con Stripe
router.post("/process-payment", paymentController.processPayment)
router.post("/create-payment-intent", paymentController.createPaymentIntent)
router.post("/confirm-payment", paymentController.confirmPayment)
router.get("/payment-status/:payment_intent_id", paymentController.getPaymentStatus)
router.get("/public-key", paymentController.getPublicKey)

export default router
