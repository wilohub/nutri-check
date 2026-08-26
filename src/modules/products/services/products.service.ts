import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { ProductsRepository } from '../repositories/products.repository';
import { OpenFoodFactsService } from '../../open-food-facts/services/open-food-facts.service';
import { GoogleSheetsService } from '../../reports/services/google-sheets.service';
import { Product } from '@prisma/client';
import { CreateProductDto } from '../dto/create-product.dto';
import { normalizeProductData } from '../../../common/utils/product-normalizer.util';
import { ExternalProductResponseDto } from '../../open-food-facts/dto/external-product-response.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly openFoodFactsService: OpenFoodFactsService,
    private readonly googleSheetsService: GoogleSheetsService,
  ) { }

  async scanProduct(barcode: string): Promise<any> {
    this.logger.log(`Escaneando producto con código: ${barcode}`);

    try {
      // 1. Buscar localmente en la base de datos
      const localProduct = await this.productsRepository.findByBarcode(barcode);
      if (localProduct) {
        const normalizedLocal = normalizeProductData(localProduct, 'local');

        this.googleSheetsService
          .appendRow('Log Escaneos', [
            new Date().toISOString(),
            barcode,
            normalizedLocal.name,
            normalizedLocal.brand,
            normalizedLocal.trafficLight.sugar,
            normalizedLocal.trafficLight.sodium,
            normalizedLocal.trafficLight.satFat,
            normalizedLocal.trafficLight.sodium,
            'App Móvil (Local DB)',
          ])
          .catch((err) => this.logger.error('Fallo asíncrono controlable de Sheets:', err.message));

        return { source: 'local', data: normalizedLocal };
      }

      // 2. Buscar en Open Food Facts (OFF) si no está local
      try {
        const offProductDto: ExternalProductResponseDto =
          await this.openFoodFactsService.fetchProductByBarcode(barcode);

        this.logger.log(`Codigo de barra del producto: ${offProductDto.barcode}`);

        if (offProductDto) {
          const normalizedOFF = normalizeProductData(offProductDto, 'off');

          this.googleSheetsService
            .appendRow('Log Escaneos', [
              new Date().toISOString(),
              barcode,
              normalizedOFF.name,
              normalizedOFF.brand,
              normalizedOFF.trafficLight.sugar,
              normalizedOFF.trafficLight.sodium,
              normalizedOFF.trafficLight.satFat,
              normalizedOFF.trafficLight.sodium,
              'App Móvil (Open Food Facts)',
            ])
            .catch((err) =>
              this.logger.error('Fallo asíncrono controlable de Sheets:', err.message),
            );

          return { source: 'off', data: normalizedOFF };
        }
      } catch (offError: any) {
        this.logger.warn(`Error buscando en OFF para el código ${barcode}: ${offError.message}`);
      }

      // 3. Si no existe en ningún lado
      throw new NotFoundException(
        `El producto con código de barras ${barcode} no está registrado en el sistema.`,
      );
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error crítico al escanear el código ${barcode}:`, error.stack);
      throw error;
    }
  }

  async createLocalProduct(dto: CreateProductDto): Promise<Product> {
    const existing = await this.productsRepository.findByBarcode(dto.barcode);
    if (existing) {
      throw new ConflictException(
        `El producto con código ${dto.barcode} ya se encuentra registrado.`,
      );
    }

    this.logger.log(`Guardando nuevo producto local verificado por OCR: ${dto.barcode}`);
    return this.productsRepository.create(dto);
  }

  async getAllProducts(): Promise<Product[]> {
    return this.productsRepository.findAll();
  }
}
