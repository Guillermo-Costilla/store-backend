import express from 'express';
import cors from 'cors';
import { config } from './config/config.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

const app = express();

app.use(express.json());
app.use(cors());

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/payments', paymentRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ message: 'API funcionando correctamente' });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Algo salió mal!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});