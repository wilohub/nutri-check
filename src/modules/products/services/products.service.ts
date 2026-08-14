import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { ProductsRepository } from '../repositories/products.repository';
import { OpenFoodFactsService } from '../../open-food-facts/services/open-food-facts.service';
import { GoogleSheetsService } from '../../reports/services/google-sheets.service'; // <-- Importar
import { Product } from '@prisma/client';
import { CreateProductDto } from '../dto/create-product.dto';

@Injectable()
export class ProductsService {
    private readonly logger = new Logger(ProductsService.name);

    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly openFoodFactsService: OpenFoodFactsService,
        private readonly googleSheetsService: GoogleSheetsService, // <-- Inyectar
    ) { }

    async scanProduct(barcode: string): Promise<any> {
        this.logger.log(`Escaneando producto con código: ${barcode}`);

        try {
            // 1. Buscar localmente en la base de datos
            const localProduct = await this.productsRepository.findByBarcode(barcode);
            if (localProduct) {
                const nut = localProduct.nutritionalData;

                // Sincronizar acción al Dashboard del Profesor de forma asíncrona (Fire & Forget)
                this.googleSheetsService.appendRow('Log Escaneos', [
                    new Date().toISOString(), // Fecha y hora exacta del escaneo
                    barcode,
                    localProduct.name,
                    localProduct.brand || 'N/A',
                    nut?.trafficLightSugar || 'BAJO',
                    nut?.trafficLightSalt || 'BAJO',
                    nut?.trafficLightSaturatedFat || 'BAJO',
                    nut?.trafficLightSodium || 'BAJO',
                    'App Móvil (Usuario Anónimo)' // <-- Indicador de consumo general
                ]).catch(err => this.logger.error('Fallo asíncrono controlable de Sheets:', err.message));

                return { source: 'local', data: localProduct };
            }

            // 2. Buscar en Open Food Facts (OFF) si no está local
            // try {
            //     const offProduct = await this.openFoodFactsService.findByBarcode(barcode);
            //     if (offProduct) {
            //         return { source: 'off', data: offProduct };
            //     }
            // } catch (offError) {
            //     this.logger.warn(`Error buscando en OFF para el código ${barcode}: ${offError.message}`);
            // }

            // 3. 🔥 LÓGICA DE CIERRE: Si no se encuentra en ningún lado, lanzamos un 404 estructurado
            throw new NotFoundException(
                `El producto con código de barras ${barcode} no está registrado en el sistema.`
            );

        } catch (error: any) {
            // Si el error ya es una excepción HTTP de NestJS (como el NotFoundException), lo relanzamos intacto
            if (error instanceof NotFoundException) {
                throw error;
            }

            // Si ocurre un error inesperado (p. ej., fallo de conexión con la DB), lo registramos y enviamos un error interno
            this.logger.error(`Error crítico al escanear el código ${barcode}:`, error.stack);
            throw error;
        }
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