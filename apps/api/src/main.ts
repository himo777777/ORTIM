import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // CORS
  app.enableCors({
    origin: process.env.WEB_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('B-ORTIM API')
      .setDescription('API for B-ORTIM medical education platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 B-ORTIM API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
