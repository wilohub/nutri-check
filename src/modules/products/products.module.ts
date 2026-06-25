import { Module } from '@nestjs/common';
import { ProductsController } from './controllers/products.controller';
import { ProductsService } from './services/products.service';
import { ProductsRepository } from './repositories/products.repository';
import { OpenFoodFactsModule } from '../open-food-facts/open-food-facts.module';
import { PrismaService } from '../../providers/database/prisma.service';
import { EvaluatorService } from './services/evaluator.service';

@Module({
    imports: [OpenFoodFactsModule], // Interconexión: Requerimos el servicio exportado de OFF
    controllers: [ProductsController],
    providers: [ProductsService, ProductsRepository, PrismaService, EvaluatorService],
})
export class ProductsModule { }