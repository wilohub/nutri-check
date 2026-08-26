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
    const url = `${this.baseUrl}/api/v3.6/product/${barcode}.json`;

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
      // const nutriments = product.nutriments || {};
      const nutriments = product.nutrition.aggregated_set.nutrients || {};
      const nutrientLevels = product.nutrient_levels || {};

      this.logger.log(product.product_name);

      const mapNutrient = (nutrient?: { unit?: string; value?: number }) => {
        if (!nutrient) {
          return null;
        }
        return {
          unit: nutrient.unit || '',
          value: roundToTwoDecimals(nutrient.value || 0),
        };
      };
      // Mapeo estricto hacia ExternalProductResponseDto
      const result: ExternalProductResponseDto = {
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
          carbohydrates: mapNutrient(nutriments['carbohydrates']),
          cholesterol: mapNutrient(nutriments['cholesterol']),
          energy: mapNutrient(nutriments['energy']),
          energyKcal: mapNutrient(nutriments['energy-kcal']),
          energyKj: mapNutrient(nutriments['energy-kj']),
          fiber: mapNutrient(nutriments['fiber']),
          proteins: mapNutrient(nutriments['proteins']),
          salt: mapNutrient(nutriments['salt']),
          saturatedFat: mapNutrient(nutriments['saturated-fat']),
          sodium: mapNutrient(nutriments['sodium']),
          sugars: mapNutrient(nutriments['sugars']),
          totalFat: mapNutrient(nutriments['fat']),
        },
      };
      this.logger.log(`Resultado mapeado para ${barcode}: ${JSON.stringify(result, null, 2)}`);
      return result;
    } catch (error: unknown) {
      // 1. Verificamos si es un objeto con la propiedad "response" (estilo Axios/HTTP)
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        (error as any).response?.status === 404
      ) {
        this.logger.warn(`Producto ${barcode} no encontrado en Open Food Facts (404)`);
        throw new NotFoundException(
          `El producto con código de barras ${barcode} no existe en Open Food Facts.`,
        );
      }
      // 2. Verificamos si ya es una excepción de NestJS
      if (error instanceof NotFoundException) {
        throw error;
      }
      // 3. Extraemos el mensaje de forma segura para el logger
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error de conexión con Open Food Facts API: ${errorMessage}`);
      throw new BadGatewayException(
        'Error de comunicación externa con el proveedor de datos alimenticios.',
      );
    }
  }
}
