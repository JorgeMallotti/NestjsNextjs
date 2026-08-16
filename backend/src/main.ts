import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
const cookieParser = require('cookie-parser');
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { SanitizationPipe } from './common/pipes/sanitization.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // Parse cookies (needed for HttpOnly JWT cookie)
  app.use(cookieParser());

  // CORS allowlist — comma-separated list of allowed frontend origins.
  // Falls back to localhost:3000 (local dev) when unset.
  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // Restricted to the frontend allowlist with credentials (for cookies) —
  // NEVER "*" with credentials.
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global sanitisation pipe — strips HTML from all inputs (XSS defence)
  app.useGlobalPipes(new SanitizationPipe());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global prefix
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
