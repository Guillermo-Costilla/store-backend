import Stripe from 'stripe';
import { config } from '../config/config.js';

const stripe = new Stripe(config.stripe.privateKey);

export const paymentController = {
    async processPayment(req, res) {
        try {
            const { amount, currency = 'usd', description } = req.body;
            const token = 'tok_visa'; // Token de prueba

            // Crear el cargo en Stripe
            const charge = await stripe.charges.create({
                amount: Math.round(amount * 100), // Convertir a centavos
                currency,
                source: token,
                description: description || 'Cargo de prueba'
            });

            res.json({
                success: true,
                charge: charge
            });

        } catch (error) {
            console.error('Error en el proceso de pago:', error);
            if (error.type === 'StripeCardError') {
                const charge = await stripe.charges.retrieve(error.payment_intent.latest_charge);
                if (charge.outcome.type === 'blocked') {
                    return res.status(400).json({ 
                        success: false,
                        error: 'Payment blocked for suspected fraud.' 
                    });
                } else if (error.code === 'card_declined') {
                    return res.status(400).json({ 
                        success: false,
                        error: 'Payment declined by the issuer.' 
                    });
                } else if (error.code === 'expired_card') {
                    return res.status(400).json({ 
                        success: false,
                        error: 'Card expired.' 
                    });
                } else {
                    return res.status(400).json({ 
                        success: false,
                        error: 'Other card error.' 
                    });
                }
            }
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    }
};