import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Trust proxy (required for secure cookies behind Render/other proxies)
  app.set('trust proxy', 1);

  app.use(cookieParser());

  const configService = app.get(ConfigService);

  // Enable CORS for frontend, allow credentials (cookies)
  const originsEnv = configService.get<string>('FRONTEND_ORIGIN') || '';
  const envOrigins = originsEnv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const nodeEnv = configService.get<string>('NODE_ENV') || process.env.NODE_ENV || 'development';
  const defaultOrigins = nodeEnv === 'development'
    ? ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173']
    : [];
  const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

  console.log('CORS allowed origins:', allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Set global API prefix (default: 'api') so routes are available under /api/*
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  app.setGlobalPrefix(apiPrefix);

  const swaggerPath = configService.get<string>('SWAGGER_PATH', '/api-docs');

  const config = new DocumentBuilder()
    .setTitle('Supermarket Inventory API')
    .setDescription('API documentation for the Supermarket Inventory Management System')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(swaggerPath, app, document);

  const port = configService.get<number>('PORT') || Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`API prefix: /${apiPrefix}`);
  console.log(`Swagger docs available at http://localhost:${port}${swaggerPath}`);
}
bootstrap();