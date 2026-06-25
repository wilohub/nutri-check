import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OpenFoodFactsService } from './services/open-food-facts.service';
import { OpenFoodFactsController } from './controllers/open-food-facts.controller';

@Module({
    imports: [
        HttpModule.register({
            timeout: 5000, // Máximo 5 segundos de espera para no penalizar la UX móvil
            maxRedirects: 3,
        }),
    ],
    controllers: [OpenFoodFactsController],
    providers: [OpenFoodFactsService],
    exports: [OpenFoodFactsService], // Se exporta para que el módulo de Productos lo pueda consumir en las siguientes fases
})
export class OpenFoodFactsModule { }