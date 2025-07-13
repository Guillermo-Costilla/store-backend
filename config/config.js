import dotenv from "dotenv"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Cargar .env desde la raíz del proyecto
dotenv.config({ path: join(__dirname, "../.env") })

// Validar variables de entorno críticas
const requiredEnvVars = {
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
  JWT_SECRET: process.env.JWT_SECRET,
}

// Verificar variables críticas en producción
if (process.env.NODE_ENV === 'production') {
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key)

  if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:', missingVars)
    console.error('⚠️  Asegúrate de configurar estas variables en Vercel')
  }
}

export const config = {
  database: {
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-for-development',
  },
  stripe: {
    privateKey: process.env.STRIPE_PRIVATE_KEY,
    publicKey: process.env.STRIPE_PUBLIC_KEY,
  },
  server: {
    port: process.env.PORT || 5000,
  },
  email: {
    authUser: process.env.EMAIL_AUTH_USER,
    authPass: process.env.EMAIL_AUTH_PASS,
  }
}