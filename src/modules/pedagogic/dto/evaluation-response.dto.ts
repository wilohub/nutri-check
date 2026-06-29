import { ApiProperty } from '@nestjs/swagger';

export class EvaluationResponseDto {
    @ApiProperty({ example: 80, description: 'Total de Nutri-Puntos ganados por el estudiante' })
    scoreEarned!: number;

    @ApiProperty({ example: 50, description: 'Puntos base según la calidad del producto' })
    baseScore!: number;

    @ApiProperty({ example: 30, description: 'Bono adicional si el producto requirió uso de OCR' })
    ocrBonus!: number;

    @ApiProperty({
        example: [
            'Este producto contiene niveles elevados de azúcares libres...',
            'Las grasas saturadas en exceso pueden acumularse en tus arterias...'
        ],
        description: 'Lista de advertencias y consejos educativos personalizados'
    })
    educationalTips!: string[];

    @ApiProperty({ example: 'Nutri-Colaborador', description: 'Insignia otorgada temporalmente por la acción' })
    badgeEarned!: string;
}