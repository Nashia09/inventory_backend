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
  const allowedOrigins = originsEnv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: allowedOrigins.length ? allowedOrigins : [/^https?:\/\/localhost:\d+$/],
    credentials: true,
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