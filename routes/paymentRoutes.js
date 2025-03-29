import express from 'express';
import { paymentController } from '../controllers/paymentController.js';

const router = express.Router();

// Solo mantener la ruta de pago
router.post('/process-pay', paymentController.processPayment);

export default router;