import { AppError } from "./AppError";

// Equivalente a HTTP 404 — recurso no encontrado
// Genera un embed rojo (error)
export class NotFoundError extends AppError {}
