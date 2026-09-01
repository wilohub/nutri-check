import { Injectable, BadRequestException, BadGatewayException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import FormData = require('form-data');
import { OcrResponseDto } from '../dto/ocr-response.dto';
import { PrismaService } from '../../../providers/database/prisma.service';
import { EvaluatorService } from '../../products/services/evaluator.service';
import { AlertLevel } from '@prisma/client';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly evaluatorService: EvaluatorService,
  ) {
    this.apiKey = this.configService.get<string>('OCR_PROVIDER_API_KEY') || 'helloworld';
  }

  async processLabelImage(file: Express.Multer.File, barcode?: string): Promise<OcrResponseDto> {
    if (!file) {
      throw new BadRequestException('Archivo de imagen de etiqueta no proporcionado.');
    }

    try {
      this.logger.log(`Enviando imagen al motor OCR externo para el producto: ${barcode || 'S/N'}`);

      const formData = new FormData();
      formData.append('file', file.buffer, { filename: file.originalname });
      formData.append('language', 'spa');
      formData.append('isOverlayRequired', 'false');
      formData.append('scale', 'true');

      const response = await firstValueFrom(
        this.httpService.post('https://api.ocr.space/parse/image', formData, {
          headers: {
            ...formData.getHeaders(),
            apikey: this.apiKey,
          },
        }),
      );

      const parsedResults = response.data?.ParsedResults;
      if (!parsedResults || parsedResults.length === 0) {
        throw new BadRequestException(
          'No se pudo extraer texto legible de la imagen proporcionada.',
        );
      }

      const rawText = parsedResults[0].ParsedText || '';
      this.logger.log('Texto extraído con éxito. Parseando campos...');

      const normalizedIngredients = this.cleanAndExtractIngredients(rawText);
      const nutritionalData = this.parseNutritionalData(rawText);
      const nutrientLevels = this.calculateNutrientLevels(nutritionalData);

      await this.prisma.ocrLog.create({
        data: {
          barcode: barcode || null,
          rawText: rawText,
          status: 'SUCCESS',
        },
      });

      return {
        barcode: barcode || null,
        name: null,
        brand: null,
        productType: 'food',
        imageUrl: null,
        ingredients: normalizedIngredients.length > 0 ? normalizedIngredients.join(', ') : null,
        quantityData: {
          display: null,
          value: null,
          unit: null,
        },
        servingQuantityData: {},
        nutrientLevels,
        nutritionalData,
        status: 'SUCCESS',
        rawText,
        normalizedIngredients,
      };
    } catch (error: any) {
      this.logger.error(`Fallo en el procesamiento OCR: ${error.message}`);
      if (error instanceof BadRequestException) throw error;
      throw new BadGatewayException(
        'El motor OCR no respondió adecuadamente o está fuera de servicio.',
      );
    }
  }

  private cleanAndExtractIngredients(text: string): string[] {
    if (!text) return [];
    let cleanText = text.toLowerCase();
    const match = cleanText.match(/(ingredientes|ingredients|ing:)(.*)/s);
    if (match && match[2]) cleanText = match[2];

    return cleanText
      .replace(/[\r\n]+/g, ' ')
      .replace(/[^a-záéíóúñ,\s]/g, '')
      .trim()
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 2);
  }

  private parseNutritionalData(text: string) {
    const getValue = (pattern: RegExp): number | null => {
      const match = text.match(pattern);
      if (match && match[1]) {
        const val = parseFloat(match[1].replace(',', '.'));
        return isNaN(val) ? null : val;
      }
      return null;
    };

    const buildNutrient = (val: number | null, unit: string = 'g') => {
      if (val === null) return { unit: null, value: null };
      return { unit, value: val };
    };

    const sugarsVal = getValue(/az[úu]cares?[\s:]*([0-9]+[.,]?[0-9]*)/i);
    const fatVal = getValue(/(grasa|grasas)[\s:]*([0-9]+[.,]?[0-9]*)/i);
    const satFatVal = getValue(/(saturadas|grasas saturadas)[\s:]*([0-9]+[.,]?[0-9]*)/i);
    const saltVal = getValue(/sal[\s:]*([0-9]+[.,]?[0-9]*)/i);
    const sodiumVal = getValue(/sodio[\s:]*([0-9]+[.,]?[0-9]*)/i);
    const carbsVal = getValue(/carbohidratos?[\s:]*([0-9]+[.,]?[0-9]*)/i);
    const proteinVal = getValue(/prote[íi]nas?[\s:]*([0-9]+[.,]?[0-9]*)/i);
    const kcalVal = getValue(/(kcal|energ[íi]a)[\s:]*([0-9]+[.,]?[0-9]*)/i);
    const fiberVal = getValue(/fibra[\s:]*([0-9]+[.,]?[0-9]*)/i);

    return {
      carbohydrates: buildNutrient(carbsVal, 'g'),
      cholesterol: { unit: null, value: null }, // Retorna null si no viene
      energy: { unit: null, value: null },
      energyKcal: buildNutrient(kcalVal, 'kcal'),
      energyKj: { unit: null, value: null },
      fiber: buildNutrient(fiberVal, 'g'),
      proteins: buildNutrient(proteinVal, 'g'),
      salt: buildNutrient(saltVal, 'g'),
      saturatedFat: buildNutrient(satFatVal, 'g'),
      sodium: buildNutrient(sodiumVal, 'g'),
      sugars: buildNutrient(sugarsVal, 'g'),
      totalFat: buildNutrient(fatVal, 'g'),
    };
  }

  private calculateNutrientLevels(nutritionalData: any): {
    fat: string | null;
    salt: string | null;
    saturatedFat: string | null;
    sugars: string | null;
  } {
    const mapLevel = (alertLevel: AlertLevel | null | undefined): string | null => {
      if (!alertLevel) return null;
      if (alertLevel === AlertLevel.ALTO) return 'high';
      if (alertLevel === AlertLevel.MEDIO) return 'moderate';
      return 'low';
    };

    // 1. Fat (Grasas Totales)
    const totalFatValue = nutritionalData?.totalFat?.value;
    const fat =
      totalFatValue != null
        ? totalFatValue > 17.5
          ? 'high'
          : totalFatValue > 3
            ? 'moderate'
            : 'low'
        : null;

    // 2. Sugars (Azúcares) con validación nula segura
    const sugarValue = nutritionalData?.sugars?.value;
    const sugars =
      sugarValue != null ? mapLevel(this.evaluatorService.getSugarLevel(sugarValue)) : null;

    // 3. Saturated Fat (Grasas Saturadas)
    const satFatValue = nutritionalData?.saturatedFat?.value;
    const saturatedFat =
      satFatValue != null
        ? mapLevel(this.evaluatorService.getSaturatedFatLevel(satFatValue))
        : null;

    // 4. Salt / Sodium (Sal)
    const saltValue = nutritionalData?.salt?.value;
    const sodiumValue = nutritionalData?.sodium?.value;

    let salt: string | null = null;
    if (saltValue != null) {
      salt = mapLevel(this.evaluatorService.getSaltLevel(saltValue));
    } else if (sodiumValue != null) {
      salt = mapLevel(this.evaluatorService.getSodiumLevel(sodiumValue));
    }

    return {
      fat,
      salt,
      saturatedFat,
      sugars,
    };
  }
}
