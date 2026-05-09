import { AppError } from "./AppError";

// Equivalente a HTTP 400 — datos inválidos o estado incorrecto
// Genera un embed amarillo (advertencia)
export class ValidationError extends AppError {}
