import { Injectable, NotFoundException, BadGatewayException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ExternalProductResponseDto } from '../dto/external-product-response.dto';
import { roundToTwoDecimals } from '../../../common/utils/math.util';

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
    const url = `${this.baseUrl}/api/v3/product/${barcode}.json`;

    try {
      this.logger.log(`Consultando producto externo con código de barras: ${barcode}`);
      const { data } = await firstValueFrom(this.httpService.get(url));

      if (!data || data.status === 0) {
        this.logger.warn(`Producto ${barcode} no encontrado en Open Food Facts`);
        throw new NotFoundException(
          `El producto con código de barras ${barcode} no existe en Open Food Facts.`,
        );
      }

      const product = data.product;
      const nutriments = product.nutriments || {};
      const nutrientLevels = product.nutrient_levels || {};

      this.logger.log(nutriments);

      // const packagingWithQuantity =
      //   data.product.ecoscore_data?.adjustments?.packaging?.packagings?.find(
      //     (item) => item.quantity_per_unit,
      //   );
      // this.logger.log(`Cantidad por unidad: ${packagingWithQuantity?.quantity_per_unit}`);

      // Mapeo estricto hacia ExternalProductResponseDto
      return {
        barcode: barcode,
        name: product.product_name || 'Producto Desconocido',
        brand: product.brands || 'Marca genérica',
        productType: product.product_type,
        imageUrl: product.image_url || null,
        ingredients: product.ingredients_text || 'No especificados',
        quantityData: {
          display: product.quantity,
          value: product.product_quantity,
          unit: product.product_quantity_unit,
        },
        servingQuantityData: {
          display: product.serving_size,
          value: product.serving_quantity,
          unit: product.serving_quantity_unit,
        },
        nutrientLevels: {
          fat: nutrientLevels['fat'],
          salt: nutrientLevels['salt'],
          saturatedFat: nutrientLevels['saturated-fat'],
          sugars: nutrientLevels['sugars'],
        },
        nutritionalData: {
          energyKcal: roundToTwoDecimals(nutriments['energy-kcal_100g']) || 0,
          carbohydrates: roundToTwoDecimals(nutriments['carbohydrates_100g']) || 0,
          sugars: roundToTwoDecimals(nutriments['sugars_100g']) || 0,
          proteins: roundToTwoDecimals(nutriments['proteins_100g']) || 0,
          totalFat: roundToTwoDecimals(nutriments['fat_100g']) || 0,
          saturatedFat: roundToTwoDecimals(nutriments['saturated-fat_100g']) || 0,
          salt: roundToTwoDecimals(nutriments['salt_100g']) || 0,
          sodium: roundToTwoDecimals(nutriments['sodium_100g']) || 0,
          fiber: roundToTwoDecimals(nutriments['fiber_100g']) || 0,
        },
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        this.logger.warn(`Producto ${barcode} no encontrado en Open Food Facts (404)`);
        throw new NotFoundException(
          `El producto con código de barras ${barcode} no existe en Open Food Facts.`,
        );
      }
      if (error instanceof NotFoundException) throw error;

      this.logger.error(`Error de conexión con Open Food Facts API: ${error.message}`);
      throw new BadGatewayException(
        'Error de comunicación externa con el proveedor de datos alimenticios.',
      );
    }
  }
}
