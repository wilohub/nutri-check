import { ApiProperty } from '@nestjs/swagger';

export class OcrResponseDto {
    @ApiProperty({ example: 'INGREDIENTES: Harina de trigo, azúcar, grasa vegetal, sal, lecitina de soya.' })
    rawText!: string;

    @ApiProperty({ example: ['harina de trigo', 'azucar', 'grasa vegetal', 'sal', 'lecitina de soya'] })
    normalizedIngredients!: string[];

    @ApiProperty({ example: 'SUCCESS' })
    status!: string;
}