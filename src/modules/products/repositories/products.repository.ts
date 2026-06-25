import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../providers/database/prisma.service';
import { Product, NutritionalData } from '@prisma/client';
import { CreateProductDto } from '../dto/create-product.dto';
import { EvaluatorService } from '../services/evaluator.service';

@Injectable()
export class ProductsRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly evaluator: EvaluatorService) { }

    async findByBarcode(barcode: string): Promise<(Product & { nutritionalData: NutritionalData | null }) | null> {
        return this.prisma.product.findUnique({
            where: { barcode },
            include: { nutritionalData: true },
        });
    }

    async create(dto: CreateProductDto): Promise<Product> {
        const nut = dto.nutritionalData;

        //calcular en tiempo real los estados del semaforo con el motor de reglas
        const lightSugar = this.evaluator.getSugarLevel(nut.sugars);
        const lightSaturatedFat = this.evaluator.getSaturatedFatLevel(nut.saturatedFat);
        const lightSodium = this.evaluator.getSodiumLevel(nut.sodium);
        const lightSalt = this.evaluator.getSaltLevel(nut.salt);

        return this.prisma.product.create({
            data: {
                barcode: dto.barcode,
                name: dto.name,
                brand: dto.brand,
                imageUrl: dto.imageUrl,
                ingredients: dto.ingredients,
                isLocal: true,
                syncStatus: 'PENDING',
                nutritionalData: {
                    create: {
                        energyKcal: nut.energyKcal,
                        carbohydrates: nut.carbohydrates,
                        sugars: nut.sugars,
                        proteins: nut.proteins,
                        totalFat: nut.totalFat,
                        saturatedFat: nut.saturatedFat,
                        salt: nut.salt,
                        sodium: nut.sodium,
                        fiber: nut.fiber,
                        // Los valores del semáforo se inicializan por defecto en BAJO. 
                        // Serán calculados formalmente por el módulo evaluador en la Fase 7.
                        // Guardar las alertas del semáforo calculadas de forma dinámica
                        trafficLightSugar: lightSugar,
                        trafficLightSaturatedFat: lightSaturatedFat,
                        trafficLightSodium: lightSodium,
                        trafficLightSalt: lightSalt,
                    },
                },
            },
            include: { nutritionalData: true },
        });
    }

    async findAll(): Promise<Product[]> {
        return this.prisma.product.findMany({
            include: { nutritionalData: true },
        });
    }
}