import express from 'express';
import { productController } from '../controllers/productController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, productController.createProduct);
router.get('/', verifyToken, productController.getProducts);
router.put('/:id', verifyToken, productController.updateProduct);
router.delete('/:id', verifyToken, productController.deleteProduct);

export default router;