import pool from '../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

// Función auxiliar para validar URLs
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}


export const userController = {
    // Registro de usuario
    async register(req, res) {
        try {
            const { nombre, email, password} = req.body;

            // Validaciones
            if (!nombre || !email || !password) {
                return res.status(400).json({ message: 'Todos los campos son requeridos' });
            }

            // Verificar si el email ya existe
            const [existingUser] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
            if (existingUser.length > 0) {
                return res.status(400).json({ message: 'El email ya está registrado' });
            }

            // Encriptar contraseña
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insertar usuario
            const [result] = await pool.query(
                'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
                [nombre, email, hashedPassword]
            );

            res.status(201).json({ message: 'Usuario registrado exitosamente' });
        } catch (error) {
            console.error('Error en registro:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // Login
    async login(req, res) {
        try {
            const { email, password } = req.body;

            const [users] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
            const user = users[0];

            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ message: 'Credenciales inválidas' });
            }

            // Usar la clave secreta desde la configuración
            const token = jwt.sign(
                { id: user.id, email: user.email },
                config.jwt.secret,
                { expiresIn: '24h' }
            );

            res.json({ 
                token, 
                user: { 
                    id: user.id, 
                    email: user.email, 
                    nombre: user.nombre,
                    imagen: user.imagen 
                } 
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Obtener perfil
    async getProfile(req, res) {
        try {
            const [user] = await pool.query(
                'SELECT id, nombre, email, imagen FROM usuarios WHERE id = ?',
                [req.user.id]
            );

            if (!user[0]) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            res.json(user[0]);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Actualizar perfil
    async updateProfile(req, res) {
        try {
            const { nombre, email, imagen } = req.body;
            
            await pool.query(
                'UPDATE usuarios SET nombre = ?, email = ?, imagen = ? WHERE id = ?',
                [nombre, email, imagen, req.user.id]
            );

            res.status(200).json({
                message: 'Perfil actualizado exitosamente',
                user: {
                    nombre,
                    email,
                    imagen
                }
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};