import express from 'express';
import {
  agregarFavorito,
  eliminarFavorito,
  obtenerFavoritos
} from '../controllers/favoritosController.js';

const router = express.Router();

router.post('/', agregarFavorito);
router.delete('/', eliminarFavorito);
router.get('/:usuario_id', obtenerFavoritos);

export default router;