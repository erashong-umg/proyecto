import path from 'path';
import winston from 'winston';

const isProd = process.env.NODE_ENV === 'production';
const logsDir = path.join(__dirname, '..', '..', 'logs');

const winstonLogger = winston.createLogger({
  level: isProd ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logsDir, 'combined.log') }),
  ],
});

// Consola: siempre activa (warn/error deben verse aunque sea producción),
// formato legible en dev, formato plano/compacto en producción.
winstonLogger.add(
  new winston.transports.Console({
    format: isProd
      ? winston.format.combine(winston.format.timestamp(), winston.format.simple())
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'HH:mm:ss' }),
          winston.format.printf(({ level, message, timestamp, ...meta }) => {
            const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} ${level}: ${message}${rest}`;
          })
        ),
  })
);

export const logger = {
  info: (...args: unknown[]) => { if (!isProd) log('info', args); },
  warn: (...args: unknown[]) => log('warn', args),
  error: (...args: unknown[]) => log('error', args),
  debug: (...args: unknown[]) => { if (!isProd) log('debug', args); },
};

function log(level: 'info' | 'warn' | 'error' | 'debug', args: unknown[]): void {
  const [message, ...rest] = args;
  winstonLogger.log(level, String(message), rest.length ? { data: rest } : undefined);
}
