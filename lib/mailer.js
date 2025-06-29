import nodemailer from 'nodemailer';
import { config } from '../config/config.js';

const transporter = nodemailer.createTransport({
  service: 'gmail', // también podés usar Mailtrap, Sendinblue, etc.
  auth: {
    user: config.email.authUser,
    pass: config.email.authPass,
  },
});

export async function enviarCorreo({ to, subject, html }) {
  const mailOptions = {
    from: `"Tienda Online" <${config.email.authUser}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📩 Correo enviado:', info.messageId);
  } catch (err) {
    console.error('❌ Error enviando email:', err);
    throw err;
  }
}