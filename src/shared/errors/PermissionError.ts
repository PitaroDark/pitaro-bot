import { AppError } from "./AppError";

// Equivalente a HTTP 403 — acción no permitida
// Genera un embed rojo (error)
export class PermissionError extends AppError {}
