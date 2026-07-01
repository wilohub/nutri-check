import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { EvaluationResponseDto } from '../dto/evaluation-response.dto';

@Injectable()
export class PedagogicService {
    private readonly logger = new Logger(PedagogicService.name);

    constructor(private readonly productsRepository: ProductsRepository) { }

    async evaluateProductForCitizen(barcode: string): Promise<EvaluationResponseDto> {
        this.logger.log(`Generando métricas de impacto de salud para el producto: ${barcode}`);

        const product = await this.productsRepository.findByBarcode(barcode);
        if (!product || !product.nutritionalData) {
            throw new NotFoundException(`El producto con código ${barcode} no tiene registro nutricional.`);
        }

        const nut = product.nutritionalData;

        // --- 1. EQUIVALENCIAS DE AZÚCAR (Límite OMS: 25g al día. 1 cucharadita = 4g) ---
        const sugarTeaspoons = parseFloat((nut.sugars / 4).toFixed(1));
        const sugarDailyPercentage = parseFloat(((nut.sugars / 25) * 100).toFixed(1));

        // --- 2. EQUIVALENCIAS DE GRASA SATURADA (Límite OMS: 20g al día. 1 porción/cucharadita = 4g) ---
        const fatUnits = parseFloat((nut.saturatedFat / 4).toFixed(1));
        const fatDailyPercentage = parseFloat(((nut.saturatedFat / 20) * 100).toFixed(1));

        // --- 3. CÁLCULO DE ENERGÍA Y EJERCICIO REQUERIDO ---
        // Calculamos las calorías que provienen estrictamente de los azúcares y grasas saturadas del producto
        // (1g de azúcar = 4 kcal, 1g de grasa = 9 kcal)
        const criticalCalories = (nut.sugars * 4) + (nut.saturatedFat * 9);

        // Caminar rápido quema ~5 kcal/min. Correr quema ~10 kcal/min.
        const walkingMinutes = Math.round(criticalCalories / 5);
        const runningMinutes = Math.round(criticalCalories / 10);

        // --- 4. GENERACIÓN DEL CONSEJO SALUDABLE DE IMPACTO ---
        let healthTip = 'Este producto tiene un perfil balanceado. Puedes consumirlo con tranquilidad dentro de tu dieta diaria.';

        if (sugarDailyPercentage >= 100 && fatDailyPercentage >= 100) {
            healthTip = `¡Cuidado Extremo! Una sola porción de esto supera simultáneamente tus límites diarios de azúcar y grasa. Prácticamente paraliza tu presupuesto de salud del día.`;
        } else if (sugarDailyPercentage >= 100) {
            healthTip = `¡Bomba de Azúcar! Este producto cubre (o supera) el 100% de los azúcares máximos que tu cuerpo debe procesar en todo un día. Considera cambiarlo por una opción natural.`;
        } else if (sugarDailyPercentage > 50) {
            healthTip = `Atención: Contiene más de la mitad del azúcar recomendada para todo tu día. Modera los demás alimentos que consumas hoy.`;
        } else if (fatDailyPercentage > 50) {
            healthTip = `Alto en grasas pesadas. Tu cuerpo tardará más tiempo en digerirlo y procesar esta energía. Evita consumirlo de noche.`;
        }

        return {
            sugar: {
                grams: nut.sugars,
                equivalentUnits: sugarTeaspoons,
                percentageOfDailyLimit: sugarDailyPercentage
            },
            saturatedFat: {
                grams: nut.saturatedFat,
                equivalentUnits: fatUnits,
                percentageOfDailyLimit: fatDailyPercentage
            },
            exercise: {
                totalCaloriesToBurn: parseFloat(criticalCalories.toFixed(1)),
                minutesWalking: walkingMinutes,
                minutesRunning: runningMinutes
            },
            healthTip
        };
    }
}