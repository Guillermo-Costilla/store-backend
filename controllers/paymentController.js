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
            res.status(400).json({ 
                success: false,
                error: error.message
            });
        }
    }
};