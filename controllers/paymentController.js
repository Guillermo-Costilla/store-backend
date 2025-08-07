import Stripe from "stripe"
import dotenv from "dotenv"
import { randomUUID } from 'crypto';
import client from '../config/database.js';
import { enviarCorreo } from "../lib/mailer.js"

dotenv.config()

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY)

export const paymentController = {
  // Crear Payment Intent
  async createPaymentIntent(req, res) {
    try {
      console.log("🔍 [DEBUG] Body completo recibido:", req.body);
      console.log("🔍 [DEBUG] Items recibidos:", req.body.items);
      console.log("🔍 [DEBUG] Tipo de items:", typeof req.body.items);
      console.log("🔍 [DEBUG] Es array?", Array.isArray(req.body.items));
      
      const { amount, currency = "usd", items = [], customer = {}, shipping = {} } = req.body;
      const usuario_id = req.user?.id || null;

      console.log("🔍 [DEBUG] Items después de destructuring:", items);
      console.log("🔍 [DEBUG] Longitud de items:", items?.length);

      if (!items || items.length === 0) {
        console.log("❌ [DEBUG] Error: items es falsy o array vacío");
        return res.status(400).json({
          success: false,
          error: "Debe incluir al menos un producto",
          code: "NO_PRODUCTS",
        });
      }

      // Crear la orden en la base de datos primero
      const orden_id = randomUUID();
      let total = 0;
      const productosDetalle = [];
      
      for (const item of items) {
        const result = await client.execute({
          sql: "SELECT * FROM productos WHERE id = ?",
          args: [item.id],
        });
        const producto = result.rows[0];
        if (!producto) {
          return res.status(404).json({
            success: false,
            error: `Producto ${item.id} no encontrado`,
            code: "PRODUCT_NOT_FOUND",
          });
        }
        if (producto.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            error: `Stock insuficiente para ${producto.nombre}. Stock disponible: ${producto.stock}`,
            code: "INSUFFICIENT_STOCK",
          });
        }
        const subtotal = producto.precio * item.quantity;
        total += subtotal;
        productosDetalle.push({
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: item.quantity,
          subtotal,
        });
      }

      // Validar datos de envío
      const { direccion, localidad, provincia, codigo_postal } = shipping;
      if (!direccion || !localidad || !provincia || !codigo_postal) {
        return res.status(400).json({
          success: false,
          error: "Debe incluir todos los datos de envío: direccion, localidad, provincia, codigo_postal",
          code: "MISSING_SHIPPING_DATA",
        });
      }

      // Crear la orden en la base de datos
      await client.execute({
        sql: "INSERT INTO ordenes (id, usuario_id, total, productos, direccion, localidad, provincia, codigo_postal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        args: [orden_id, usuario_id, total, JSON.stringify(productosDetalle), direccion, localidad, provincia, codigo_postal],
      });

      // Crear metadata con información del pedido
      const metadata = {
        customer_email: customer.email || "",
        customer_name: customer.name || "",
        customer_region: customer.region || "",
        items_count: items.length.toString(),
        order_date: new Date().toISOString(),
        orden_id: orden_id,
        usuario_id: usuario_id || "",
      };
      if (items.length > 0) {
        metadata.first_item = items[0].name || "Producto";
        metadata.total_items = items.length.toString();
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Ya viene en centavos desde el frontend
        currency,
        metadata,
        description: `Compra de ${items.length} producto(s) - ${customer.name || "Cliente"}`,
        receipt_email: customer.email || undefined,
        automatic_payment_methods: { enabled: true },
      });

      // Actualizar la orden con el payment_intent_id
      await client.execute({
        sql: "UPDATE ordenes SET stripe_payment_intent_id = ? WHERE id = ?",
        args: [paymentIntent.id, orden_id],
      });

      // Obtener datos del usuario para el correo
      const usuarioResult = await client.execute({
        sql: "SELECT nombre, email FROM usuarios WHERE id = ?",
        args: [usuario_id],
      });

      const usuario = usuarioResult.rows[0];

      // Crear tabla HTML con los productos
      const productosHTML = productosDetalle.map(producto => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${producto.nombre}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${producto.cantidad}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${Number(producto.precio).toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${Number(producto.subtotal).toFixed(2)}</td>
        </tr>
      `).join('');

      // Enviar correo de confirmación
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
      });

      res.json({
        success: true,
        orden_id,
        total: amount / 100, // Convertir de centavos a dólares
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      });
    } catch (error) {
      console.error("Error creando Payment Intent:", error);

      // Manejo específico de errores de Stripe
      if (error.type === "StripeCardError") {
        return res.status(400).json({
          success: false,
          error: "Error con la tarjeta: " + error.message,
          code: "CARD_ERROR",
          decline_code: error.decline_code,
        })
      }

      if (error.type === "StripeInvalidRequestError") {
        return res.status(400).json({
          success: false,
          error: "Solicitud inválida: " + error.message,
          code: "INVALID_REQUEST",
        })
      }

      res.status(500).json({
        success: false,
        error: "Error interno del servidor de pagos",
        code: "INTERNAL_ERROR",
        message: error.message,
      })
    }
  },

  // Confirmar pago
  async confirmPayment(req, res) {
    try {
      const { payment_intent_id, payment_method_id } = req.body

      if (!payment_intent_id) {
        return res.status(400).json({
          success: false,
          error: "ID de Payment Intent requerido",
          code: "MISSING_PAYMENT_INTENT",
        })
      }

      const paymentIntent = await stripe.paymentIntents.confirm(payment_intent_id, {
        payment_method: payment_method_id,
        return_url: "https://tu-dominio.com/payment/success",
      })

      res.json({
        success: true,
        payment_intent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          client_secret: paymentIntent.client_secret,
        },
      })
    } catch (error) {
      console.error("Error confirmando pago:", error)

      res.status(400).json({
        success: false,
        error: error.message,
        code: error.code || "CONFIRMATION_ERROR",
      })
    }
  },

  // Procesar pago (método legacy actualizado)
  async processPayment(req, res) {
    try {
      const { token, amount, currency = "usd", description, items = [], customer = {} } = req.body

      // Validar token/payment method
      if (!token) {
        return res.status(400).json({
          success: false,
          error: "Token de pago requerido",
          code: "MISSING_TOKEN",
        })
      }

      // Validar monto
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: "El monto debe ser mayor a 0",
          code: "INVALID_AMOUNT",
        })
      }

      // Crear Payment Intent sin confirmar automáticamente
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount),
        currency,
        description: description || `Compra de ${items.length} producto(s)`,
        payment_method: token,
        confirm: false, // No confirmar automáticamente
        receipt_email: customer.email || undefined,
        metadata: {
          customer_email: customer.email || "",
          customer_name: customer.name || "",
          items_count: items.length.toString(),
        },
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
      })

      console.log("Payment Intent creado:", paymentIntent.id, "Estado:", paymentIntent.status)

      // Si el Payment Intent requiere confirmación manual
      if (paymentIntent.status === "requires_confirmation") {
        // Intentar confirmar el pago
        const confirmedPayment = await stripe.paymentIntents.confirm(paymentIntent.id, {
          payment_method: token,
        })

        console.log("Pago confirmado:", confirmedPayment.id, "Estado:", confirmedPayment.status)

        // Verificar el estado final
        if (confirmedPayment.status === "succeeded") {
          res.json({
            success: true,
            payment_intent: {
              id: confirmedPayment.id,
              status: confirmedPayment.status,
              amount: confirmedPayment.amount,
              currency: confirmedPayment.currency,
              receipt_url: confirmedPayment.charges?.data[0]?.receipt_url || null,
            },
            message: "Pago procesado exitosamente",
          })
        } else if (confirmedPayment.status === "requires_payment_method") {
          res.status(400).json({
            success: false,
            error: "El método de pago fue rechazado. Por favor, intenta con otra tarjeta.",
            code: "PAYMENT_METHOD_REJECTED",
            payment_intent_id: confirmedPayment.id,
            client_secret: confirmedPayment.client_secret,
          })
        } else {
          res.status(400).json({
            success: false,
            error: `El pago no pudo ser procesado. Estado: ${confirmedPayment.status}`,
            code: "PAYMENT_INCOMPLETE",
            payment_intent_id: confirmedPayment.id,
            status: confirmedPayment.status,
          })
        }
      } else if (paymentIntent.status === "succeeded") {
        // Pago exitoso inmediatamente
        res.json({
          success: true,
          payment_intent: {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            receipt_url: paymentIntent.charges?.data[0]?.receipt_url || null,
          },
          message: "Pago procesado exitosamente",
        })
      } else {
        // Otros estados
        res.status(400).json({
          success: false,
          error: `El pago no pudo ser procesado. Estado: ${paymentIntent.status}`,
          code: "PAYMENT_INCOMPLETE",
          payment_intent_id: paymentIntent.id,
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret,
        })
      }
    } catch (error) {
      console.error("Error procesando pago:", error)

      // Respuesta detallada según el tipo de error
      const errorResponse = {
        success: false,
        error: "Error procesando el pago",
        code: "PAYMENT_ERROR",
      }

      if (error.type === "StripeCardError") {
        errorResponse.error = "Tarjeta rechazada: " + error.message
        errorResponse.code = "CARD_DECLINED"
        errorResponse.decline_code = error.decline_code
      } else if (error.type === "StripeInvalidRequestError") {
        errorResponse.error = "Datos de pago inválidos: " + error.message
        errorResponse.code = "INVALID_REQUEST"
      } else if (error.type === "StripeAuthenticationError") {
        errorResponse.error = "Error de autenticación con Stripe"
        errorResponse.code = "AUTH_ERROR"
      } else if (error.type === "StripeRateLimitError") {
        errorResponse.error = "Demasiadas solicitudes. Intenta de nuevo en unos momentos."
        errorResponse.code = "RATE_LIMIT"
      }

      res.status(400).json(errorResponse)
    }
  },

  // Obtener estado de un pago
  async getPaymentStatus(req, res) {
    try {
      const { payment_intent_id } = req.params

      const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)

      res.json({
        success: true,
        payment_intent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          created: paymentIntent.created,
        },
      })
    } catch (error) {
      console.error("Error obteniendo estado del pago:", error)
      res.status(400).json({
        success: false,
        error: error.message,
        code: "RETRIEVAL_ERROR",
      })
    }
  },

  // Obtener clave pública
  async getPublicKey(req, res) {
    console.log("👉 Se llamó a /public-key")
    const publicKey = process.env.STRIPE_PUBLIC_KEY
  
    if (!publicKey) {
      return res.status(500).json({
        success: false,
        error: "Clave pública no configurada",
      })
    }
  
    res.json({
      success: true,
      public_key: publicKey,
    })
  },

  // Webhook de Stripe
  async stripeWebhook(req, res) {
    console.log("[WEBHOOK] Webhook recibido de Stripe")
    const sig = req.headers['stripe-signature']
    let event
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      )
      console.log("[WEBHOOK] Firma verificada correctamente")
      console.log("[WEBHOOK] Tipo de evento:", event.type)
    } catch (err) {
      console.error('❌ Firma de webhook inválida:', err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    // Procesar eventos relevantes
    switch (event.type) {
      case 'payment_intent.succeeded':
        try {
          const paymentIntent = event.data.object
          const orden_id = paymentIntent.metadata?.orden_id
          console.log('✅ Pago exitoso:', paymentIntent.id, 'para orden:', orden_id)

          if (orden_id) {
            // Importar el cliente de base de datos
            const client = (await import('../config/database.js')).default
            const result = await client.execute({
              sql: "UPDATE ordenes SET pago = ? WHERE id = ?",
              args: ["pagado", orden_id],
            })
            console.log("[WEBHOOK] Orden actualizada a pagado:", result.rowsAffected, "filas afectadas")
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
      case 'payment_intent.payment_failed':
        try {
          const failedPayment = event.data.object
          const failed_orden_id = failedPayment.metadata?.orden_id
          console.log('❌ Pago fallido:', failedPayment.id, 'para orden:', failed_orden_id)

          if (failed_orden_id) {
            const client = (await import('../config/database.js')).default
            const result = await client.execute({
              sql: "UPDATE ordenes SET pago = ? WHERE id = ?",
              args: ["cancelado", failed_orden_id],
            })
            console.log("[WEBHOOK] Orden actualizada a cancelado:", result.rowsAffected, "filas afectadas")
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
        console.log(`🔔 Evento recibido: ${event.type}`)
    }
    
    res.status(200).json({ received: true })
  },
}

