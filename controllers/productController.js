import client from "../config/database.js"

export const productController = {
  // Crear producto (solo admin)
  async createProduct(req, res) {
    try {
      const { nombre, categoria, imagen, descripcion, precio, stock } = req.body

      if (req.user.rol !== "admin") {
        return res.status(403).json({ message: "Acceso denegado. Solo administradores pueden crear productos." })
      }

      await client.execute({
        sql: "INSERT INTO productos (nombre, categoria, imagen, descripcion, precio, stock) VALUES (?, ?, ?, ?, ?, ?)",
        args: [nombre, categoria, imagen, descripcion, precio, stock],
      })

      res.status(201).json({ message: "Producto creado exitosamente" })
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  // Obtener todos los productos (público)
  async getProducts(req, res) {
    try {
      const { categoria, limit = 50, offset = 0 } = req.query

      let sql = "SELECT * FROM productos WHERE stock > 0"
      const args = []

      if (categoria) {
        sql += " AND categoria = ?"
        args.push(categoria)
      }

      sql += " ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?"
      args.push(Number.parseInt(limit), Number.parseInt(offset))

      const result = await client.execute({ sql, args })
      res.json(result.rows)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  // Obtener producto por ID
  async getProductById(req, res) {
    try {
      const { id } = req.params

      const result = await client.execute({
        sql: "SELECT * FROM productos WHERE id = ?",
        args: [id],
      })

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Producto no encontrado" })
      }

      res.json(result.rows[0])
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  // Actualizar producto (solo admin)
  async updateProduct(req, res) {
    try {
      const { id } = req.params
      const { nombre, categoria, imagen, descripcion, precio, stock, puntuacion } = req.body

      if (req.user.rol !== "admin") {
        return res.status(403).json({ message: "Acceso denegado. Solo administradores pueden actualizar productos." })
      }

      const result = await client.execute({
        sql: "UPDATE productos SET nombre = ?, categoria = ?, imagen = ?, descripcion = ?, precio = ?, stock = ?, puntuacion = ? WHERE id = ?",
        args: [nombre, categoria, imagen, descripcion, precio, stock, puntuacion || 0, id],
      })

      if (result.rowsAffected === 0) {
        return res.status(404).json({ message: "Producto no encontrado" })
      }

      res.json({ message: "Producto actualizado exitosamente" })
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  // Eliminar producto (solo admin)
  async deleteProduct(req, res) {
    try {
      const { id } = req.params

      if (req.user.rol !== "admin") {
        return res.status(403).json({ message: "Acceso denegado. Solo administradores pueden eliminar productos." })
      }

      const result = await client.execute({
        sql: "DELETE FROM productos WHERE id = ?",
        args: [id],
      })

      if (result.rowsAffected === 0) {
        return res.status(404).json({ message: "Producto no encontrado" })
      }

      res.json({ message: "Producto eliminado exitosamente" })
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  // Obtener categorías disponibles
  async getCategories(req, res) {
    try {
      const result = await client.execute({
        sql: "SELECT DISTINCT categoria FROM productos ORDER BY categoria",
      })

      const categories = result.rows.map((row) => row.categoria)
      res.json(categories)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },
}
