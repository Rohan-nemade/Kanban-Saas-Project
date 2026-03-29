import * as z from 'zod';
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
  new winston.transports.Console()]

});

// Expose commonly used libs
export { z };
export * from './middleware.js';