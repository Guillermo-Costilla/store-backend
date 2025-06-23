import express from "express"
import { orderController } from "../controllers/orderController.js"
import { verifyToken, verifyAdmin } from "../middlewares/authMiddleware.js"

const router = express.Router()

// Rutas de usuario
router.post("/", verifyToken, orderController.createOrder)
router.get("/my-orders", verifyToken, orderController.getUserOrders)

// Rutas de administrador
router.get("/all", verifyToken, verifyAdmin, orderController.getAllOrders)
router.put("/:id/status", verifyToken, verifyAdmin, orderController.updateOrderStatus)

// Rutas de pago
router.post("/confirm-payment", orderController.confirmPayment)

// Webhook de Stripe
router.post("/webhook/stripe", orderController.stripeWebhook)

export default router
