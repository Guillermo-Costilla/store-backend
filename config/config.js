import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar .env desde la raíz del proyecto
dotenv.config({ path: join(__dirname, '../.env') });

export const config = {
    database: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    },
    jwt: {
        secret: process.env.JWT_SECRET,
    },
    stripe: {
        privateKey: process.env.STRIPE_PRIVATE_KEY,
    },
    server: {
        port: process.env.PORT || 5000
    }
};