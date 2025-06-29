import client from "../config/database.js"
import Stripe from "stripe"
import { config } from "../config/config.js"
import { enviarCorreo } from "../lib/mailer.js" // Envío de correos

const stripe = new Stripe(config.stripe.privateKey)

export const orderController = {
  // Crear orden
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

  // Los demás métodos no se modifican pero se mantienen:
  // getUserOrders, getAllOrders, updateOrderStatus, confirmPayment, stripeWebhook
}
