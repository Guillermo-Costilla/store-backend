import express from 'express';
import { obtenerMétricasAdmin } from '../controllers/adminController.js';

const router = express.Router();

router.get('/dashboard', obtenerMétricasAdmin);

export default router;