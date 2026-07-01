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

        // 1. Buscar local
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

        // 2. Buscar en OFF... (Continúa igual el código de OFF de la fase anterior)

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