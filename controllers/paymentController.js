import Stripe from "stripe"
import { config } from "../config/config.js"

const stripe = new Stripe(config.stripe.privateKey)

export const paymentController = {
  async processPayment(req, res) {
    try {
      const { amount, currency = "usd", description } = req.body
      const token = "tok_visa" // Token de prueba

      // Crear el cargo en Stripe
      const charge = await stripe.charges.create({
        amount: Math.round(amount * 100), // Convertir a centavos
        currency,
        source: token,
        description: description || "Cargo de prueba",
      })

      res.json({
        success: true,
        charge: charge,
      })
    } catch (error) {
      console.error("Error en el proceso de pago:", error)

      // Handle different types of Stripe errors
      if (error.type === "StripeCardError") {
        // A payment error occurred (card declined, etc.)
        if (error.payment_intent) {
          try {
            // Get the charge to check if it was blocked for fraud
            const charge = await stripe.charges.retrieve(error.payment_intent.latest_charge)

            if (charge && charge.outcome && charge.outcome.type === "blocked") {
              return res.status(400).json({
                success: false,
                error: "Payment blocked for suspected fraud.",
              })
            }
          } catch (retrieveError) {
            console.error("Error retrieving charge details:", retrieveError)
          }
        }

        // Handle specific card errors
        if (error.code === "card_declined") {
          return res.status(400).json({
            success: false,
            error: "Payment declined by the issuer.",
          })
        } else if (error.code === "expired_card") {
          return res.status(400).json({
            success: false,
            error: "Card expired.",
          })
        } else if (error.code === "incorrect_cvc") {
          return res.status(400).json({
            success: false,
            error: "Incorrect CVC code.",
          })
        } else if (error.code === "processing_error") {
          return res.status(400).json({
            success: false,
            error: "An error occurred while processing your card.",
          })
        } else {
          return res.status(400).json({
            success: false,
            error: error.message || "Card error occurred.",
          })
        }
      } else if (error.type === "StripeInvalidRequestError") {
        // Invalid parameters were supplied to Stripe's API
        return res.status(400).json({
          success: false,
          error: "Invalid request to payment processor.",
        })
      } else if (error.type === "StripeAPIError") {
        // An error occurred internally with Stripe's API
        return res.status(500).json({
          success: false,
          error: "An error occurred with the payment processor.",
        })
      } else if (error.type === "StripeConnectionError") {
        // Some kind of error occurred during the HTTPS communication
        return res.status(503).json({
          success: false,
          error: "Unable to connect to payment processor.",
        })
      } else if (error.type === "StripeAuthenticationError") {
        // Authentication with Stripe's API failed
        console.error("Stripe authentication error - check API keys")
        return res.status(500).json({
          success: false,
          error: "Internal server error with payment processor.",
        })
      } else if (error.type === "StripeRateLimitError") {
        // Too many requests made to the API too quickly
        return res.status(429).json({
          success: false,
          error: "Too many payment requests. Please try again later.",
        })
      } else {
        // Generic error handler for unexpected errors
        console.error("Unexpected payment error:", error)
        return res.status(500).json({
          success: false,
          error: "An unexpected error occurred during payment processing.",
        })
      }
    }
  },
}

