import { Module } from '@nestjs/common';
import { PedagogicController } from './controllers/pedagogic.controller';
import { PedagogicService } from './services/pedagogic.service';
import { ProductsRepository } from '../products/repositories/products.repository';
import { EvaluatorService } from '../products/services/evaluator.service';
import { PrismaService } from '../../providers/database/prisma.service';

@Module({
    controllers: [PedagogicController],
    providers: [PedagogicService, ProductsRepository, EvaluatorService, PrismaService],
})
export class PedagogicModule { }