import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { ProductsRepository } from '../repositories/products.repository';
import { OpenFoodFactsService } from '../../open-food-facts/services/open-food-facts.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { Product } from '@prisma/client';
import { EvaluatorService } from './evaluator.service';

@Injectable()
export class ProductsService {
    private readonly logger = new Logger(ProductsService.name);

    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly openFoodFactsService: OpenFoodFactsService,
    ) { }

    async scanProduct(barcode: string): Promise<any> {
        this.logger.log(`Escaneando producto con código: ${barcode}`);

        // 1. Buscar en la base de datos local (cache o productos creados por OCR)
        const localProduct = await this.productsRepository.findByBarcode(barcode);
        if (localProduct) {
            this.logger.log(`Producto ${barcode} encontrado localmente.`);
            return { source: 'local', data: localProduct };
        }

        // 2. Si no existe localmente, delegar al módulo Open Food Facts externo
        // Si OFF lanza un 404, este escalará directamente al cliente móvil de forma limpia
        const externalProduct = await this.openFoodFactsService.fetchProductByBarcode(barcode);
        const nutriments = externalProduct.nutritionalData;

        // Instanciar un objeto evaluador directo o inyectar para calcular al vuelo
        const evaluator = new EvaluatorService();
        const saltVal = externalProduct.nutritionalData.salt || (nutriments.sodium * 2.5);

        return {
            source: 'open_food_facts',
            data: {
                externalProduct,
                nutritionalData: {
                    ...nutriments,
                    salt: saltVal,
                    trafficLightSugar: evaluator.getSugarLevel(nutriments.sugars),
                    trafficLightSaturatedFat: evaluator.getSaturatedFatLevel(nutriments.saturatedFat),
                    trafficLightSodium: evaluator.getSodiumLevel(nutriments.sodium),
                    trafficLightSalt: evaluator.getSaltLevel(saltVal),
                },
            },
        };
    }

    async createLocalProduct(dto: CreateProductDto): Promise<Product> {
        const existing = await this.productsRepository.findByBarcode(dto.barcode);
        if (existing) {
            throw new ConflictException(`El producto con código ${dto.barcode} ya se encuentra registrado.`);
        }

        this.logger.log(`Guardando nuevo producto local verificado por OCR: ${dto.barcode}`);
        return this.productsRepository.create(dto);
    }

    async getAllProducts(): Promise<Product[]> {
        return this.productsRepository.findAll();
    }
}