import express from "express"
import { productController } from "../controllers/productController.js"
import { verifyToken, verifyAdmin } from "../middlewares/authMiddleware.js"

const router = express.Router()

// Rutas públicas
router.get("/", productController.getProducts)
router.get("/categories", productController.getCategories)
router.get("/:id", productController.getProductById)

// Rutas de administrador
router.post("/", verifyToken, verifyAdmin, productController.createProduct)
router.put("/:id", verifyToken, verifyAdmin, productController.updateProduct)
router.delete("/:id", verifyToken, verifyAdmin, productController.deleteProduct)

export default router
