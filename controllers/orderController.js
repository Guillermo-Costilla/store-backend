import client from "../config/database.js"
import Stripe from "stripe"
import { config } from "../config/config.js"
import { enviarCorreo } from "../lib/mailer.js"
import { randomUUID } from 'crypto'

const stripe = new Stripe(config.stripe.privateKey)

export const orderController = {
  async createOrder(req, res) {
    try {
      const { productos, direccion, localidad, provincia, codigo_postal } = req.body
      const usuario_id = req.user.id

      if (!productos || productos.length === 0) {
        return res.status(400).json({ message: "Debe incluir al menos un producto" })
      }

      // Validar datos de envío
      if (!direccion || !localidad || !provincia || !codigo_postal) {
        return res.status(400).json({ 
          message: "Debe incluir todos los datos de envío: direccion, localidad, provincia, codigo_postal" 
        })
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

      const orden_id = randomUUID()

      const orderResult = await client.execute({
        sql: "INSERT INTO ordenes (id, usuario_id, total, productos, direccion, localidad, provincia, codigo_postal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        args: [orden_id, usuario_id, total, JSON.stringify(productosDetalle), direccion, localidad, provincia, codigo_postal],
      })

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: "usd",
        metadata: {
          orden_id: orden_id,
          usuario_id,
        },
        automatic_payment_methods: { enabled: true },
      })

      await client.execute({
        sql: "UPDATE ordenes SET stripe_payment_intent_id = ? WHERE id = ?",
        args: [paymentIntent.id, orden_id],
      })

      const usuarioResult = await client.execute({
        sql: "SELECT nombre, email FROM usuarios WHERE id = ?",
        args: [usuario_id],
      })

      const usuario = usuarioResult.rows[0]

      // Crear tabla HTML con los productos
      const productosHTML = productosDetalle.map(producto => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${producto.nombre}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${producto.cantidad}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${Number(producto.precio).toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${Number(producto.subtotal).toFixed(2)}</td>
        </tr>
      `).join('')

      await enviarCorreo({
        to: usuario.email,
        subject: "🎉 Confirmación de tu orden en Store",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Hola ${usuario.nombre}, ¡gracias por tu compra!</h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">📦 Detalles de tu orden #${orden_id}</h3>
              
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <thead>
                  <tr style="background-color: #e9ecef;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Producto</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Cantidad</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Precio Unit.</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${productosHTML}
                </tbody>
                <tfoot>
                  <tr style="background-color: #f8f9fa; font-weight: bold;">
                    <td colspan="3" style="padding: 10px; text-align: right; border-top: 2px solid #dee2e6;">Total:</td>
                    <td style="padding: 10px; text-align: right; border-top: 2px solid #dee2e6;">$${Number(total).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1976d2;">🚚 Información de envío</h3>
              <p style="margin: 5px 0;"><strong>Dirección:</strong> ${direccion}</p>
              <p style="margin: 5px 0;"><strong>Localidad:</strong> ${localidad}</p>
              <p style="margin: 5px 0;"><strong>Provincia:</strong> ${provincia}</p>
              <p style="margin: 5px 0;"><strong>Código Postal:</strong> ${codigo_postal}</p>
            </div>

            <p style="color: #666; font-size: 14px;">Podés seguir el estado de tu orden desde tu cuenta.</p>
            <p style="color: #333; font-weight: bold;">¡Nos alegra tenerte como cliente! 💙</p>
          </div>
        `,
      })

      res.status(201).json({
        message: "Orden creada exitosamente",
        orden_id,
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
    console.log("[WEBHOOK] Webhook recibido de Stripe")
    console.log("[WEBHOOK] Tipo de evento:", req.headers['stripe-signature'] ? 'Con firma' : 'Sin firma')
    
    const sig = req.headers["stripe-signature"]
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

    console.log("[WEBHOOK] Endpoint secret configurado:", endpointSecret ? 'Sí' : 'No')

    let event

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
      console.log("[WEBHOOK] Firma verificada correctamente")
      console.log("[WEBHOOK] Tipo de evento:", event.type)
    } catch (err) {
      console.log(`[WEBHOOK] Error verificando firma:`, err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        try {
          const paymentIntent = event.data.object
          const orden_id = paymentIntent.metadata?.orden_id
          console.log("[WEBHOOK] payment_intent.succeeded para orden:", orden_id, "Estado:", paymentIntent.status)

          if (orden_id) {
            const result = await client.execute({
              sql: "UPDATE ordenes SET pago = ? WHERE id = ?",
              args: ["pagado", orden_id],
            })
            console.log("[WEBHOOK] Resultado del update:", result)
            if (result.rowsAffected === 0) {
              console.error("[WEBHOOK] No se encontró la orden para actualizar:", orden_id)
            }
          } else {
            console.error("[WEBHOOK] No se encontró orden_id en metadata del paymentIntent")
          }
        } catch (err) {
          console.error("[WEBHOOK] Error actualizando la orden:", err)
        }
        break

      case "payment_intent.payment_failed":
        try {
          const failedPayment = event.data.object
          const failed_orden_id = failedPayment.metadata?.orden_id
          console.log("[WEBHOOK] payment_intent.payment_failed para orden:", failed_orden_id)

          if (failed_orden_id) {
            const result = await client.execute({
              sql: "UPDATE ordenes SET pago = ? WHERE id = ?",
              args: ["cancelado", failed_orden_id],
            })
            console.log("[WEBHOOK] Resultado del update (fallido):", result)
            if (result.rowsAffected === 0) {
              console.error("[WEBHOOK] No se encontró la orden para actualizar (fallido):", failed_orden_id)
            }
          } else {
            console.error("[WEBHOOK] No se encontró orden_id en metadata del paymentIntent (fallido)")
          }
        } catch (err) {
          console.error("[WEBHOOK] Error actualizando la orden (fallido):", err)
        }
        break

      default:
        console.log(`[WEBHOOK] Unhandled event type ${event.type}`)
    }

    res.json({ received: true })
  }
}
