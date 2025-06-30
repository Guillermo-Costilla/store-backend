import client from "../config/database.js"
import Stripe from "stripe"
import { config } from "../config/config.js"
import { enviarCorreo } from "../lib/mailer.js"

const stripe = new Stripe(config.stripe.privateKey)

export const orderController = {
  async createOrder(req, res) {
    try {
      const { productos } = req.body
      const usuario_id = req.user.id

      if (!productos || productos.length === 0) {
        return res.status(400).json({ message: "Debe incluir al menos un producto" })
      }

      let total = 0
      const productosDetalle = []

      for (const item of productos) {
        const result = await client.execute({
          sql: "SELECT * FROM productos WHERE id = ?",
          args: [item.producto_id],
        })

        const producto = result.rows[0]
        if (!producto) {
          return res.status(404).json({ message: `Producto ${item.producto_id} no encontrado` })
        }

        if (producto.stock < item.cantidad) {
          return res.status(400).json({
            message: `Stock insuficiente para ${producto.nombre}. Stock disponible: ${producto.stock}`,
          })
        }

        const subtotal = producto.precio * item.cantidad
        total += subtotal

        productosDetalle.push({
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: item.cantidad,
          subtotal,
        })
      }

      const orderResult = await client.execute({
        sql: "INSERT INTO ordenes (usuario_id, total, productos) VALUES (?, ?, ?)",
        args: [usuario_id, total, JSON.stringify(productosDetalle)],
      })

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: "usd",
        metadata: {
          orden_id: orderResult.meta.last_row_id.toString(),
          usuario_id,
        },
        automatic_payment_methods: { enabled: true },
      })

      await client.execute({
        sql: "UPDATE ordenes SET stripe_payment_intent_id = ? WHERE id = ?",
        args: [paymentIntent.id, orderResult.meta.last_row_id],
      })

      const usuarioResult = await client.execute({
        sql: "SELECT nombre, email FROM usuarios WHERE id = ?",
        args: [usuario_id],
      })

      const usuario = usuarioResult.rows[0]

      await enviarCorreo({
        to: usuario.email,
        subject: "🎉 Confirmación de tu orden en Tienda Online",
        html: `
          <h2>Hola ${usuario.nombre}, ¡gracias por tu compra!</h2>
          <p>Tu orden <strong>#${orderResult.meta.last_row_id}</strong> fue creada por un total de <strong>$${total}</strong>.</p>
          <p>Podés seguir el estado de tu orden desde tu cuenta.</p>
          <p>Nos alegra tenerte como cliente 💙</p>
        `,
      })

      res.status(201).json({
        message: "Orden creada exitosamente",
        orden_id: orderResult.meta.last_row_id,
        total,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      })
    } catch (error) {
      console.error("Error creando orden:", error)
      res.status(500).json({ message: error.message })
    }
  },

  async getUserOrders(req, res) {
    try {
      const usuario_id = req.user.id
      const result = await client.execute({
        sql: "SELECT * FROM ordenes WHERE usuario_id = ? ORDER BY fecha_creacion DESC",
        args: [usuario_id],
      })

      const ordenes = result.rows.map((orden) => ({
        ...orden,
        productos: JSON.parse(orden.productos),
      }))

      res.json(ordenes)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  async getAllOrders(req, res) {
    try {
      if (req.user.rol !== "admin") {
        return res.status(403).json({ message: "Acceso denegado" })
      }

      const { limit = 50, offset = 0, estado, pago } = req.query
      let sql =
        "SELECT o.*, u.nombre as usuario_nombre, u.email as usuario_email FROM ordenes o JOIN usuarios u ON o.usuario_id = u.id"
      const args = []
      const conditions = []

      if (estado) {
        conditions.push("o.estado = ?")
        args.push(estado)
      }
      if (pago) {
        conditions.push("o.pago = ?")
        args.push(pago)
      }
      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ")
      }

      sql += " ORDER BY o.fecha_creacion DESC LIMIT ? OFFSET ?"
      args.push(Number.parseInt(limit), Number.parseInt(offset))

      const result = await client.execute({ sql, args })

      const ordenes = result.rows.map((orden) => ({
        ...orden,
        productos: JSON.parse(orden.productos),
      }))

      res.json(ordenes)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  async updateOrderStatus(req, res) {
    try {
      if (req.user.rol !== "admin") {
        return res.status(403).json({ message: "Acceso denegado" })
      }

      const { id } = req.params
      const { estado, pago } = req.body

      const updates = []
      const args = []

      if (estado) {
        updates.push("estado = ?")
        args.push(estado)
      }
      if (pago) {
        updates.push("pago = ?")
        args.push(pago)
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: "Debe proporcionar al menos un campo para actualizar" })
      }

      args.push(id)

      const result = await client.execute({
        sql: `UPDATE ordenes SET ${updates.join(", ")} WHERE id = ?`,
        args,
      })

      if (result.rowsAffected === 0) {
        return res.status(404).json({ message: "Orden no encontrada" })
      }

      if (estado === "enviado") {
        const orderResult = await client.execute({
          sql: "SELECT productos FROM ordenes WHERE id = ?",
          args: [id],
        })

        const productos = JSON.parse(orderResult.rows[0].productos)

        for (const item of productos) {
          await client.execute({
            sql: "UPDATE productos SET stock = stock - ? WHERE id = ?",
            args: [item.cantidad, item.id],
          })
        }
      }

      res.json({ message: "Estado de orden actualizado exitosamente" })
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  async confirmPayment(req, res) {
    try {
      const { payment_intent_id } = req.body
      const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)

      if (paymentIntent.status === "succeeded") {
        const orden_id = paymentIntent.metadata.orden_id

        await client.execute({
          sql: "UPDATE ordenes SET pago = ? WHERE id = ?",
          args: ["pagado", orden_id],
        })

        res.json({ message: "Pago confirmado exitosamente" })
      } else {
        res.status(400).json({ message: "El pago no fue exitoso" })
      }
    } catch (error) {
      console.error("Error confirmando pago:", error)
      res.status(500).json({ message: error.message })
    }
  },

  async stripeWebhook(req, res) {
    const sig = req.headers["stripe-signature"]
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

    let event

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object
        const orden_id = paymentIntent.metadata.orden_id

        if (orden_id) {
          await client.execute({
            sql: "UPDATE ordenes SET pago = ? WHERE id = ?",
            args: ["pagado", orden_id],
          })
        }
        break

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object
        const failed_orden_id = failedPayment.metadata.orden_id

        if (failed_orden_id) {
          await client.execute({
            sql: "UPDATE ordenes SET pago = ? WHERE id = ?",
            args: ["cancelado", failed_orden_id],
          })
        }
        break

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    res.json({ received: true })
  }
}
