import Stripe from "stripe"
import { config } from "../config/config.js"

const stripe = new Stripe(config.stripe.privateKey)

export const paymentController = {
  async processPayment(req, res) {
    try {
      // Obtener los datos del cuerpo de la solicitud
      const { 
        paymentMethodId, 
        amount, 
        currency = 'usd', 
        description, 
        email, 
        name,
        metadata = {} 
      } = req.body;

      // Verificar que se proporcionó un ID de método de pago
      if (!paymentMethodId) {
          return res.status(400).json({
              success: false,
              error: 'Se requiere un método de pago'
          });
      }

      // Verificar que el monto es válido
      if (!amount || isNaN(amount) || amount <= 0) {
          return res.status(400).json({
              success: false,
              error: 'Monto de pago inválido'
          });
      }

      // Crear el PaymentIntent en Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convertir a centavos
        currency,
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        description: description || "Compra en línea",
        receipt_email: email,
        metadata: {
          customer_name: name,
          ...metadata
        }
      });

      // Verificar el estado del PaymentIntent
      if (paymentIntent.status === 'succeeded') {
        // Pago completado exitosamente
        return res.json({
          success: true,
          paymentIntent: {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency
          }
        });
      } else if (paymentIntent.status === 'requires_action') {
        // El pago requiere autenticación adicional (3D Secure)
        return res.json({
          requires_action: true,
          payment_intent_client_secret: paymentIntent.client_secret
        });
      } else {
        // Otro estado del PaymentIntent
        return res.status(400).json({
          success: false,
          error: `Pago no completado. Estado: ${paymentIntent.status}`
        });
      }
    } catch (error) {
      console.error("Error en el proceso de pago:", error)

      // Handle different types of Stripe errors
      if (error.type === "StripeCardError") {
        // A payment error occurred (card declined, etc.)
        if (error.payment_intent) {
          try {
            // Get the payment intent to check if it was blocked for fraud
            const paymentIntent = await stripe.paymentIntents.retrieve(error.payment_intent.id);

            if (paymentIntent && paymentIntent.last_payment_error && 
                paymentIntent.last_payment_error.code === "authentication_required") {
              return res.status(400).json({
                success: false,
                error: "This card requires authentication.",
                requires_action: true,
                payment_intent_client_secret: paymentIntent.client_secret
              });
            }
            
            if (paymentIntent && paymentIntent.outcome && paymentIntent.outcome.type === "blocked") {
              return res.status(400).json({
                success: false,
                error: "Payment blocked for suspected fraud.",
              });
            }
          } catch (retrieveError) {
            console.error("Error retrieving payment intent details:", retrieveError);
          }
        }

        // Handle specific card errors
        if (error.code === "card_declined") {
          return res.status(400).json({
            success: false,
            error: "Payment declined by the issuer.",
          });
        } else if (error.code === "expired_card") {
          return res.status(400).json({
            success: false,
            error: "Card expired.",
          });
        } else if (error.code === "incorrect_cvc") {
          return res.status(400).json({
            success: false,
            error: "Incorrect CVC code.",
          });
        } else if (error.code === "processing_error") {
          return res.status(400).json({
            success: false,
            error: "An error occurred while processing your card.",
          });
        } else {
          return res.status(400).json({
            success: false,
            error: error.message || "Card error occurred.",
          });
        }
      } else if (error.type === "StripeInvalidRequestError") {
        // Invalid parameters were supplied to Stripe's API
        return res.status(400).json({
          success: false,
          error: "Invalid request to payment processor.",
        });
      } else if (error.type === "StripeAPIError") {
        // An error occurred internally with Stripe's API
        return res.status(500).json({
          success: false,
          error: "An error occurred with the payment processor.",
        });
      } else if (error.type === "StripeConnectionError") {
        // Some kind of error occurred during the HTTPS communication
        return res.status(503).json({
          success: false,
          error: "Unable to connect to payment processor.",
        });
      } else if (error.type === "StripeAuthenticationError") {
        // Authentication with Stripe's API failed
        console.error("Stripe authentication error - check API keys");
        return res.status(500).json({
          success: false,
          error: "Internal server error with payment processor.",
        });
      } else if (error.type === "StripeRateLimitError") {
        // Too many requests made to the API too quickly
        return res.status(429).json({
          success: false,
          error: "Too many payment requests. Please try again later.",
        });
      } else {
        // Generic error handler for unexpected errors
        console.error("Unexpected payment error:", error);
        return res.status(500).json({
          success: false,
          error: "An unexpected error occurred during payment processing.",
        });
      }
    }
  },

  /**
   * Endpoint para crear un PaymentIntent sin confirmarlo inmediatamente
   * Útil para implementaciones de Elements o Checkout de Stripe
   */
  async createPaymentIntent(req, res) {
    try {
      const { amount, currency = 'usd', metadata = {} } = req.body;

      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Monto de pago inválido'
        });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return res.json({
        success: true,
        clientSecret: paymentIntent.client_secret
      });
    } catch (error) {
      console.error('Error al crear payment intent:', error);
      
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al crear el intent de pago'
      });
    }
  }
}

