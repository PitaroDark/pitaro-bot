import winston from "winston";

export class Logger {
  private static readonly isDev = process.env.NODE_ENV !== "production";

  private static readonly devFormat = winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.colorize({ level: true }),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ level, message, timestamp, context, stack }) => {
      const ctx = context ? ` [${context}]` : "";
      const prefix = `${timestamp} ${level}${ctx}`;
      const text = String(stack ?? message);
      if (!text.includes("\n")) return `${prefix} ${text}`;
      return text.split("\n").filter((line) => line.trim()).map((line) => `${prefix} ${line}`).join("\n");
    })
  );

  private static readonly prodFormat = winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp(),
    winston.format.json()
  );

  private static readonly winstonLogger = winston.createLogger({
    level: process.env.LOG_LEVEL ?? (Logger.isDev ? "debug" : "info"),
    format: Logger.isDev ? Logger.devFormat : Logger.prodFormat,
    transports: [new winston.transports.Console()],
  });

  constructor(private readonly context: string) {}

  private stringify(value: unknown): string {
    if (typeof value === "string") return value;
    if (value instanceof Error) return value.message;
    return String(value);
  }

  private buildMeta(message: unknown, args: unknown[]) {
    const err = message instanceof Error
      ? message
      : args.find((arg): arg is Error => arg instanceof Error);
    return {
      context: this.context,
      ...(err?.stack && { stack: err.stack }),
    };
  }

  public debug(message: unknown, ...args: unknown[]): void {
    Logger.winstonLogger.debug(this.stringify(message), this.buildMeta(message, args));
  }

  public log(message: unknown, ...args: unknown[]): void {
    Logger.winstonLogger.info(this.stringify(message), this.buildMeta(message, args));
  }

  public info(message: unknown, ...args: unknown[]): void {
    Logger.winstonLogger.info(this.stringify(message), this.buildMeta(message, args));
  }

  public warn(message: unknown, ...args: unknown[]): void {
    Logger.winstonLogger.warn(this.stringify(message), this.buildMeta(message, args));
  }

  public error(message: unknown, ...args: unknown[]): void {
    Logger.winstonLogger.error(this.stringify(message), this.buildMeta(message, args));
  }
}
