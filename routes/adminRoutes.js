import express from 'express';
import { 
  obtenerMétricasAdmin, 
  obtenerOrdenesCompletas, 
  obtenerOrdenDetallada,
  obtenerUsuariosAdmin
} from '../controllers/adminController.js';
import { verifyAdmin, verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Proteger todas las rutas de admin con autenticación
router.use(verifyToken);
router.use(verifyAdmin);

// Dashboard de métricas (solo admin)
router.get('/dashboard', obtenerMétricasAdmin);

// Obtener órdenes con información completa del usuario y dirección
router.get('/orders', obtenerOrdenesCompletas);

// Obtener orden específica con información detallada
router.get('/orders/:id', obtenerOrdenDetallada);

// Obtener todos los usuarios registrados (solo admin)
router.get('/users', obtenerUsuariosAdmin);

export default router;