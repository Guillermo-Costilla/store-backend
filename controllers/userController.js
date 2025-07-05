import client from "../config/database.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { config } from "../config/config.js"

export const userController = {
  // Registro de usuario
  async register(req, res) {
    try {
      const {
        nombre,
        email,
        password,
        pais = "Argentina",
        localidad = "Buenos Aires",
        codigo_postal = "1000",
      } = req.body

      // Validaciones
      if (!nombre || !email || !password) {
        return res.status(400).json({ message: "Todos los campos son requeridos" })
      }

      // Verificar si el email ya existe
      const existingUser = await client.execute({
        sql: "SELECT id FROM usuarios WHERE email = ?",
        args: [email],
      })

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: "El email ya está registrado" })
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10)

      // Insertar usuario (siempre como 'usuario', no admin)
      await client.execute({
        sql: "INSERT INTO usuarios (nombre, email, contraseña, pais, localidad, codigo_postal, rol) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [nombre, email, hashedPassword, pais, localidad, codigo_postal, "usuario"],
      })

      res.status(201).json({ message: "Usuario registrado exitosamente" })
    } catch (error) {
      console.error("Error en registro:", error)
      res.status(500).json({ message: error.message })
    }
  },

  // Login
  async login(req, res) {
    try {
      const { email, password } = req.body

      const result = await client.execute({
        sql: "SELECT * FROM usuarios WHERE email = ?",
        args: [email],
      })

      const user = result.rows[0]

      if (!user || !bcrypt.compare(password, user.contraseña)) {
        return res.status(401).json({ message: "Credenciales inválidas" })
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          rol: user.rol,
        },
        config.jwt.secret,
        { expiresIn: "24h" },
      )

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          rol: user.rol,
          pais: user.pais,
          localidad: user.localidad,
          codigo_postal: user.codigo_postal,
        },
      })
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  // Obtener perfil
  async getProfile(req, res) {
    try {
      const result = await client.execute({
        sql: "SELECT id, nombre, email, pais, localidad, codigo_postal, rol FROM usuarios WHERE id = ?",
        args: [req.user.id],
      })

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" })
      }

      res.json(result.rows[0])
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  // Actualizar perfil
  async updateProfile(req, res) {
    try {
      const { nombre, email, pais, localidad, codigo_postal } = req.body

      await client.execute({
        sql: "UPDATE usuarios SET nombre = ?, email = ?, pais = ?, localidad = ?, codigo_postal = ? WHERE id = ?",
        args: [nombre, email, pais, localidad, codigo_postal, req.user.id],
      })

      res.status(200).json({
        message: "Perfil actualizado exitosamente",
        user: { nombre, email, pais, localidad, codigo_postal },
      })
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },
}
