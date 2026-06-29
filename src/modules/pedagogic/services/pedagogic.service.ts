import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { AlertLevel } from '@prisma/client';
import { EvaluationResponseDto } from '../dto/evaluation-response.dto';

@Injectable()
export class PedagogicService {
    private readonly logger = new Logger(PedagogicService.name);

    constructor(private readonly productsRepository: ProductsRepository) { }

    async evaluateProductForStudent(barcode: string): Promise<EvaluationResponseDto> {
        this.logger.log(`Generando reporte pedagógico y puntos para el producto: ${barcode}`);

        // 1. Buscar el producto en la base de datos local
        const product = await this.productsRepository.findByBarcode(barcode);
        if (!product || !product.nutritionalData) {
            throw new NotFoundException(`El producto con código ${barcode} no tiene un registro nutricional completo.`);
        }

        const nut = product.nutritionalData;
        const tips: string[] = [];

        // 2. Lógica de generación de Plantillas Pedagógicas
        if (nut.trafficLightSugar === AlertLevel.ALTO) {
            tips.push(
                '¡Alerta de Azúcar! Este producto contiene niveles elevados de azúcares libres. Consumirlo en exceso puede provocar picos de energía seguidos de fatiga súbita, afectando tu atención en clases. ¡Intenta cambiarlo por una fruta fresca!'
            );
        }

        if (nut.trafficLightSaturatedFat === AlertLevel.ALTO) {
            tips.push(
                '¡Grasas Saturadas en nivel crítico! Estas grasas pueden acumularse en tus arterias y quitarte agilidad física. Recuerda que la energía de calidad para tus entrenamientos y recreos viene de frutos secos o aguacate.'
            );
        }

        if (nut.trafficLightSalt === AlertLevel.ALTO) {
            tips.push(
                '¡Cuidado con la Sal! Un nivel alto de sal oculta obliga a tu corazón a trabajar más de la cuenta. Los snacks empaquetados suelen excederse aquí. ¡Acompaña siempre tu día con agua pura para limpiarte!'
            );
        }

        if (nut.trafficLightSodium === AlertLevel.ALTO && nut.trafficLightSalt !== AlertLevel.ALTO) {
            tips.push(
                '¡Sodio Elevado! El sodio es parte de la sal y se usa como conservante químico. Aunque no lo sientas salado, retiene líquidos en tu cuerpo. Intenta consumir alimentos menos procesados.'
            );
        }

        // Mensaje motivacional si todo es saludable (Verde)
        if (tips.length === 0) {
            tips.push('¡Excelente elección! Este alimento es balanceado y seguro para tu nutrición diaria. Sigue manteniendo este excelente rendimiento escolar.');
        }

        // 3. Motor de Gamificación (Cálculo de Nutri-Puntos)
        let baseScore = 50; // Por defecto asumimos producto excelente (Todo verde)

        const tieneRojos =
            nut.trafficLightSugar === AlertLevel.ALTO ||
            nut.trafficLightSaturatedFat === AlertLevel.ALTO ||
            nut.trafficLightSalt === AlertLevel.ALTO ||
            nut.trafficLightSodium === AlertLevel.ALTO;

        const tieneAmarillos =
            nut.trafficLightSugar === AlertLevel.MEDIO ||
            nut.trafficLightSaturatedFat === AlertLevel.MEDIO ||
            nut.trafficLightSalt === AlertLevel.MEDIO ||
            nut.trafficLightSodium === AlertLevel.MEDIO;

        if (tieneRojos) {
            baseScore = 10; // Producto crítico (Puntaje mínimo por el hecho de informarse)
        } else if (tieneAmarillos) {
            baseScore = 25; // Producto regular
        }

        // Bono de co-creador si el producto fue registrado de forma local (OCR / Manual)
        const ocrBonus = product.isLocal ? 30 : 0;
        const scoreEarned = baseScore + ocrBonus;

        // Determinar insignia temporal
        let badgeEarned = 'Nutri-Explorador';
        if (ocrBonus > 0) badgeEarned = 'Nutri-Colaborador';
        if (baseScore === 50 && ocrBonus === 0) badgeEarned = 'Nutri-Saludable';

        return {
            scoreEarned,
            baseScore,
            ocrBonus,
            educationalTips: tips,
            badgeEarned,
        };
    }
}