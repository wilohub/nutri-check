import { Injectable, NotFoundException, BadGatewayException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ExternalProductResponseDto } from '../dto/external-product-response.dto';

@Injectable()
export class OpenFoodFactsService {
    private readonly logger = new Logger(OpenFoodFactsService.name);
    private readonly baseUrl: string | undefined;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.baseUrl = this.configService.get<string>('OPEN_FOOD_FACTS_API_URL');
    }

    async fetchProductByBarcode(barcode: string): Promise<ExternalProductResponseDto> {
        // URL estandarizada de la API de Open Food Facts para formato JSON v2
        const url = `${this.baseUrl}/api/v2/product/${barcode}.json`;

        try {
            this.logger.log(`Consultando producto externo con código de barras: ${barcode}`);
            const { data } = await firstValueFrom(this.httpService.get(url));

            if (!data || data.status === 0) {
                this.logger.warn(`Producto ${barcode} no encontrado en Open Food Facts`);
                throw new NotFoundException(`El producto con código de barras ${barcode} no existe en Open Food Facts.`);
            }

            const product = data.product;
            const nutriments = product.nutriments || {};

            // Mapeo e inmunización de valores nulos o indefinidos hacia nuestro estándar del MVP
            return {
                barcode: barcode,
                name: product.product_name || 'Producto Desconocido',
                brand: product.brands || 'Marca genérica',
                imageUrl: product.image_url || null,
                ingredients: product.ingredients_text || 'No especificados',
                nutritionalData: {
                    energyKcal: Number(nutriments['energy-kcal_100g']) || 0,
                    carbohydrates: Number(nutriments['carbohydrates_100g']) || 0,
                    sugars: Number(nutriments['sugars_100g']) || 0,
                    proteins: Number(nutriments['proteins_100g']) || 0,
                    totalFat: Number(nutriments['fat_100g']) || 0,
                    saturatedFat: Number(nutriments['saturated-fat_100g']) || 0,
                    salt: Number(nutriments['salt_100g']) || 0,
                    sodium: Number(nutriments['sodium_100g']) || 0,
                    fiber: Number(nutriments['fiber_100g']) || 0,
                },
            };
        } catch (error: any) {
            // 1. Interceptar si la API externa respondió explícitamente con un 404 (No Encontrado)
            if (error.response?.status === 404) {
                this.logger.warn(`Producto ${barcode} no encontrado en Open Food Facts (404)`);
                throw new NotFoundException(`El producto con código de barras ${barcode} no existe en Open Food Facts.`);
            }
            // 2. Manejo para otros errores de pasarela (caída de internet, timeout, etc.)
            this.logger.error(`Error de conexión con Open Food Facts API: ${error.message}`);
            throw new BadGatewayException('Error de comunicación externa con el proveedor de datos alimenticios.');
        }
    }
}