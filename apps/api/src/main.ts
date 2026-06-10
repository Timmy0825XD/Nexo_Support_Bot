import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  if (!process.env.INTERNAL_API_KEY) {
    console.error('Missing INTERNAL_API_KEY in environment');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3001'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`API running on http://localhost:${port}/api`);
}

bootstrap();
