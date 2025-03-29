import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar .env desde la raíz del proyecto
dotenv.config({ path: path.join(__dirname, '../.env') });

export const STRIPE_PRIVATE_KEY = process.env.STRIPE_PRIVATE_KEY;

export const config = {
    jwt: {
        secret: process.env.JWT_SECRET
    },
    stripe: {
        privateKey: process.env.STRIPE_PRIVATE_KEY
    },
    database: {
        host: 'sql10.freesqldatabase.com',
        user: 'sql10770315',
        password: 'Em4SAqG1pP',
        database: 'sql10770315',
        port: 3306
    },
    server: {
        port: process.env.PORT || 5000
    }
};