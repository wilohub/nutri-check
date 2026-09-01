import { ApiProperty } from '@nestjs/swagger';

class QuantityDataDto {
  @ApiProperty({ example: '150 g', nullable: true })
  display!: string | null;

  @ApiProperty({ example: 150, nullable: true })
  value!: number | null;

  @ApiProperty({ example: 'g', nullable: true })
  unit!: string | null;
}

class NutrientLevelsDto {
  @ApiProperty({ example: 'high', nullable: true })
  fat!: string | null;

  @ApiProperty({ example: 'high', nullable: true })
  salt!: string | null;

  @ApiProperty({ example: 'moderate', nullable: true })
  saturatedFat!: string | null;

  @ApiProperty({ example: 'low', nullable: true })
  sugars!: string | null;
}

class NutrientValueDto {
  @ApiProperty({ example: 'g', nullable: true })
  unit!: string | null;

  @ApiProperty({ example: 1.8, nullable: true })
  value!: number | null;
}

class NutritionalDataDto {
  @ApiProperty({ type: NutrientValueDto })
  carbohydrates!: NutrientValueDto;

  @ApiProperty({ type: NutrientValueDto })
  cholesterol!: NutrientValueDto;

  @ApiProperty({ type: NutrientValueDto })
  energy!: NutrientValueDto;

  @ApiProperty({ type: NutrientValueDto })
  energyKcal!: NutrientValueDto;

  @ApiProperty({ type: NutrientValueDto })
  energyKj!: NutrientValueDto;

  @ApiProperty({ type: NutrientValueDto })
  fiber!: NutrientValueDto;

  @ApiProperty({ type: NutrientValueDto })
  proteins!: NutrientValueDto;

  @ApiProperty({ type: NutrientValueDto })
  salt!: NutrientValueDto;

  @ApiProperty({ type: NutrientValueDto })
  saturatedFat!: NutrientValueDto;

  @ApiProperty({ type: NutrientValueDto })
  sodium!: NutrientValueDto;

  @ApiProperty({ type: NutrientValueDto })
  sugars!: NutrientValueDto;

  @ApiProperty({ type: NutrientValueDto })
  totalFat!: NutrientValueDto;
}

export class OcrResponseDto {
  @ApiProperty({ example: '8410199023148', nullable: true })
  barcode!: string | null;

  @ApiProperty({ example: 'Patatas fritas con sabor a jamón', nullable: true })
  name!: string | null;

  @ApiProperty({ example: 'Ruffles, Pepsico', nullable: true })
  brand!: string | null;

  @ApiProperty({ example: 'food', nullable: true })
  productType!: string | null;

  @ApiProperty({ example: 'https://images.openfoodfacts.org/...', nullable: true })
  imageUrl!: string | null;

  @ApiProperty({ example: 'Patatas, aceite de girasol, sal...', nullable: true })
  ingredients!: string | null;

  @ApiProperty({ type: QuantityDataDto })
  quantityData!: QuantityDataDto;

  @ApiProperty({ example: {} })
  servingQuantityData!: Record<string, any>;

  @ApiProperty({ type: NutrientLevelsDto })
  nutrientLevels!: NutrientLevelsDto;

  @ApiProperty({ type: NutritionalDataDto })
  nutritionalData!: NutritionalDataDto;

  @ApiProperty({ example: 'SUCCESS' })
  status!: string;

  @ApiProperty({ example: 'INGREDIENTES: Patatas, aceite...' })
  rawText!: string;

  @ApiProperty({ example: ['patatas', 'aceite de girasol', 'sal'] })
  normalizedIngredients!: string[];
}
