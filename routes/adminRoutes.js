import express from 'express';
import { 
  obtenerMétricasAdmin, 
  obtenerOrdenesCompletas, 
  obtenerOrdenDetallada 
} from '../controllers/adminController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Proteger todas las rutas de admin con autenticación
router.use(authenticateToken);

// Dashboard de métricas (solo admin)
router.get('/dashboard', obtenerMétricasAdmin);

// Obtener órdenes con información completa del usuario y dirección
router.get('/orders', obtenerOrdenesCompletas);

// Obtener orden específica con información detallada
router.get('/orders/:id', obtenerOrdenDetallada);

export default router;