import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Ampliar el limite para JSON y datos codificados en la URL (hasta 15mb)
  app.use(json({ limit: '15mb' }));
  app.use(urlencoded({ extended: true, limit: '15mb' }));

  // 🔥 ACTIVA ESTA LÍNEA AQUÍ PARA PERMITIR PETICIONES DESDE TU CELULAR
  app.enableCors({
    origin: '*', // Permite conexiones desde cualquier origen (esencial para desarrollo móvil)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const apiPrefix = configService.get<string>('API_PREFIX') || 'api/v1';

  // Configuración de prefijo global para la API de la aplicación móvil
  app.setGlobalPrefix(apiPrefix);

  // Activación global de Pipes de validación estructurada para DTOs (Fail-Fast)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remueve propiedades que no estén en el DTO
      forbidNonWhitelisted: true, // Lanza error si se envían propiedades no permitidas
      transform: true, // Transforma tipos automáticamente (ej. string a number)
    }),
  );

  // Configuración estructurada de la documentación de Swagger OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Proyecto Nutri-Check API')
    .setDescription(
      'Documentación del Backend del MVP Nutri-Check para competencias estudiantiles.\n' +
        'Permite el escaneo de códigos de barra, evaluación nutricional por semáforo y procesamiento OCR.',
    )
    .setVersion('1.0.0')
    .addTag('Products', 'Operaciones relacionadas al procesamiento y consulta de alimentos')
    .addTag('OCR', 'Endpoints de extracción de texto y digitalización de etiquetas')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  const server = await app.listen(port, '0.0.0.0');
  logger.log(`Servidor de Nutri-Check corriendo exitosamente en el puerto: ${server}`);
  logger.log(`Documentación de Swagger disponible en: http://localhost:${port}/${apiPrefix}/docs`);
}
bootstrap();
