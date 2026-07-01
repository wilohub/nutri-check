import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';

// Infraestructura y Proveedores
import { PrismaService } from './providers/database/prisma.service';
import { ReportsModule } from './modules/reports/reports.module';

// Módulos de Negocio Core de Nutri-Check
import { ProductsModule } from './modules/products/products.module';
import { OcrModule } from './modules/ocr/ocr.module';
import { PedagogicModule } from './modules/pedagogic/pedagogic.module';

// Interceptores
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    // Configuración global de Variables de Entorno (.env)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Conectores externos y reportes (Google Sheets)
    ReportsModule,

    // Dominios de la Aplicación
    ProductsModule,
    OcrModule,
    PedagogicModule,
  ],
  controllers: [],
  providers: [
    PrismaService,
    // Registrar el interceptor de auditoría de rendimiento a nivel global
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule { }