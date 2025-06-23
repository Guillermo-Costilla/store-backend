import jwt from "jsonwebtoken"
import { config } from "../config/config.js"

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Token no proporcionado" })
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" })
  }
}

export const verifyAdmin = (req, res, next) => {
  if (req.user.rol !== "admin") {
    return res.status(403).json({ message: "Acceso denegado. Se requieren permisos de administrador." })
  }
  next()
}
