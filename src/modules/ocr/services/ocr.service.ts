import { Injectable, BadRequestException, BadGatewayException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
// import * as FormData from 'form-data';
import FormData = require('form-data');
import { OcrResponseDto } from '../dto/ocr-response.dto';
import { PrismaService } from '../../../providers/database/prisma.service';

@Injectable()
export class OcrService {
    private readonly logger = new Logger(OcrService.name);
    private readonly apiKey: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        this.apiKey = this.configService.get<string>('OCR_PROVIDER_API_KEY') || 'helloworld';
    }

    async processLabelImage(file: Express.Multer.File, barcode?: string): Promise<OcrResponseDto> {
        if (!file) {
            throw new BadRequestException('Archivo de imagen de etiqueta no proporcionado.');
        }

        try {
            this.logger.log(`Enviando imagen al motor OCR externo para el producto: ${barcode || 'S/N'}`);

            // Construcción del Payload Multipart para la API de OCR.space
            const formData = new FormData();
            formData.append('file', file.buffer, { filename: file.originalname });
            formData.append('language', 'spa'); // Procesar en Español
            formData.append('isOverlayRequired', 'false');
            formData.append('scale', 'true');    // Pre-procesamiento de la imagen para mejorar lectura

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
                throw new BadRequestException('No se pudo extraer texto legible de la imagen proporcionada.');
            }

            const rawText = parsedResults[0].ParsedText || '';
            this.logger.log('Texto extraído con éxito. Procediendo a normalizar ingredientes.');

            // Ejecutar lógica de normalización de ingredientes
            const normalizedIngredients = this.cleanAndExtractIngredients(rawText);

            // Auditoría en Base de Datos (OcrLog)
            await this.prisma.ocrLog.create({
                data: {
                    barcode: barcode || null,
                    rawText: rawText,
                    status: 'SUCCESS',
                },
            });

            return {
                rawText,
                normalizedIngredients,
                status: 'SUCCESS',
            };
        } catch (error: any) {
            this.logger.error(`Fallo en el procesamiento OCR: ${error.message}`);

            if (error instanceof BadRequestException) throw error;

            throw new BadGatewayException('El motor OCR no respondió adecuadamente o está fuera de servicio.');
        }
    }

    /**
     * Limpia el texto en bruto, aísla la sección de ingredientes y los separa en un arreglo.
     */
    private cleanAndExtractIngredients(text: string): string[] {
        if (!text) return [];

        // Convertir a minúsculas para estandarizar
        let cleanText = text.toLowerCase();

        // Intentar buscar dónde empieza la sección de ingredientes para descartar ruido
        const match = cleanText.match(/(ingredientes|ingredients|ing:)(.*)/s);
        if (match && match[2]) {
            cleanText = match[2];
        }

        // Remover saltos de línea, caracteres especiales típicos de tablas nutricionales y excesos de espacios
        cleanText = cleanText
            .replace(/[\r\n]+/g, ' ')
            .replace(/[^a-záéíóúñ,\s]/g, '') // Mantener solo letras, comas y espacios
            .trim();

        // Separar por comas e individualizar la lista
        return cleanText
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 2); // Filtrar fragmentos de texto basura menores a 2 caracteres
    }
}