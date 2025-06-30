import dotenv from "dotenv"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Cargar .env desde la raíz del proyecto
dotenv.config({ path: join(__dirname, "../.env") })

export const config = {
  database: {
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
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