import pool from '../config/database.js';

export const productController = {
    // Crear producto
    async createProduct(req, res) {
        try {
            const { nombre, descripcion, precio, stock } = req.body;
            const userId = req.user.id;

            const [result] = await pool.query(
                'INSERT INTO productos (nombre, descripcion, precio, stock, usuario_id) VALUES (?, ?, ?, ?, ?)',
                [nombre, descripcion, precio, stock, userId]
            );

            res.status(201).json({ 
                message: 'Producto creado exitosamente',
                productId: result.insertId 
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Obtener productos
    async getProducts(req, res) {
        try {
            const [products] = await pool.query('SELECT * FROM productos WHERE usuario_id = ?', [req.user.id]);
            res.json(products);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Actualizar producto
    async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const { nombre, descripcion, precio, stock } = req.body;

            const [result] = await pool.query(
                'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ? WHERE id = ? AND usuario_id = ?',
                [nombre, descripcion, precio, stock, id, req.user.id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Producto no encontrado' });
            }

            res.json({ message: 'Producto actualizado exitosamente' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Eliminar producto
    async deleteProduct(req, res) {
        try {
            const { id } = req.params;

            const [result] = await pool.query(
                'DELETE FROM productos WHERE id = ? AND usuario_id = ?',
                [id, req.user.id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Producto no encontrado' });
            }

            res.json({ message: 'Producto eliminado exitosamente' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};