import { Injectable } from '@nestjs/common';
import { AlertLevel } from '@prisma/client';

@Injectable()
export class EvaluatorService {

    /**
     * Evalúa los gramos de azúcar por cada 100g
     */
    getSugarLevel(grams: number): AlertLevel {
        if (grams <= 5.0) return AlertLevel.BAJO;
        if (grams <= 22.5) return AlertLevel.MEDIO;
        return AlertLevel.ALTO;
    }

    /**
     * Evalúa los gramos de grasas saturadas por cada 100g
     */
    getSaturatedFatLevel(grams: number): AlertLevel {
        if (grams <= 1.5) return AlertLevel.BAJO;
        if (grams <= 5.0) return AlertLevel.MEDIO;
        return AlertLevel.ALTO;
    }

    /**
     * Evalúa los gramos de sodio por cada 100g
     */
    getSodiumLevel(grams: number): AlertLevel {
        if (grams <= 0.12) return AlertLevel.BAJO;
        if (grams <= 0.6) return AlertLevel.MEDIO;
        return AlertLevel.ALTO;
    }

    /**
     * Evalúa los gramos de sal por cada 100g
     */
    getSaltLevel(grams: number): AlertLevel {
        if (grams <= 0.3) return AlertLevel.BAJO;
        if (grams <= 1.5) return AlertLevel.MEDIO;
        return AlertLevel.ALTO;
    }
}