import Stripe from "stripe"

const stripe = new Stripe(
  "sk_test_51R0DGDCr7qNJfD5UHXhNpLJk4xjsAhHNGlOQyKidJctY18YFeiSggaTC8yjBzOa4TLIFIbMz2RaHIVtNghfplDqQ00ReuhkXrT",
)

export const paymentController = {
  // Crear Payment Intent
  async createPaymentIntent(req, res) {
    try {
      const { amount, currency = "usd", items = [], customer = {} } = req.body

      // Validaciones
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: "El monto debe ser mayor a 0",
          code: "INVALID_AMOUNT",
        })
      }

      // Crear metadata con información del pedido
      const metadata = {
        customer_email: customer.email || "",
        customer_name: customer.name || "",
        customer_region: customer.region || "",
        items_count: items.length.toString(),
        order_date: new Date().toISOString(),
      }

      // Agregar información de productos a metadata (limitado por Stripe)
      if (items.length > 0) {
        metadata.first_item = items[0].nombre || "Producto"
        metadata.total_items = items.length.toString()
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Ya viene en centavos desde el frontend
        currency,
        metadata,
        description: `Compra de ${items.length} producto(s) - ${customer.name || "Cliente"}`,
        receipt_email: customer.email || undefined,
        automatic_payment_methods: {
          enabled: true,
        },
      })

      console.log("Payment Intent creado:", paymentIntent.id)

      res.json({
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      })
    } catch (error) {
      console.error("Error creando Payment Intent:", error)

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

      // Crear y confirmar Payment Intent en un solo paso
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount),
        currency,
        description: description || `Compra de ${items.length} producto(s)`,
        payment_method: token,
        confirm: true,
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

      console.log("Pago procesado exitosamente:", paymentIntent.id)

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
    const publicKey = process.env.STRIPE_PUBLIC_KEY || "pk_test_51R0DGDCr7qNJfD5UIOTV4XrH9AMY9IYk6IaenLpZoTlYQAOwNAvWBYJMbcIJhjTlGIaONa80Vi1NB55HxD9hbCN10010FtOXzM"
  
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
  }
  ,
}

