import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './common/config/env.validation';
import { OpenFoodFactsModule } from './modules/open-food-facts/open-food-facts.module';
import { ProductsModule } from './modules/products/products.module';
import { OcrModule } from './modules/ocr/ocr.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,                         // Hace accesible la configuración en cualquier módulo sin re-importar
      validationSchema: envValidationSchema,   // Aplica la validación estructurada con Joi
      cache: true,                            // Optimiza el acceso a variables en memoria
    }),
    OpenFoodFactsModule,
    ProductsModule,
    OcrModule,

  ],
  controllers: [],
  providers: [],
})
export class AppModule { }