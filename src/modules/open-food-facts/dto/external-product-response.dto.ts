import { ApiProperty } from '@nestjs/swagger';

export class ExternalProductResponseDto {
  @ApiProperty({ example: '7861011100123', description: 'Código de barras del producto' })
  barcode!: string;

  @ApiProperty({
    example: 'Avena Quaker Instantánea',
    description: 'Nombre comercial del producto',
  })
  name!: string;

  @ApiProperty({ example: 'Quaker', description: 'Marca del fabricante' })
  brand!: string;

  @ApiProperty({ example: 'food', description: 'Tipo del producto' })
  productType!: string;

  @ApiProperty({ example: 'https://images.openfoodfacts.org/...', description: 'URL de la imagen' })
  imageUrl!: string;

  @ApiProperty({
    example: 'Avena en hojuelas, azúcar, canela',
    description: 'Ingredientes en bruto',
  })
  ingredients!: string;

  @ApiProperty({ description: 'Valor de la cantidad del producto' })
  quantityData!: {
    display: string;
    value: number;
    unit: string;
  };

  @ApiProperty({ description: 'Valor cantidades por porciones' })
  servingQuantityData!: {
    display: string;
    value: number;
    unit: string;
  };

  @ApiProperty({ description: 'Valores para el semaforo nutricional' })
  nutrientLevels!: {
    fat: string;
    salt: string;
    saturatedFat: string;
    sugars: string;
  };

  @ApiProperty({ description: 'Valores nutricionales por cada 100g/100ml' })
  nutritionalData!: {
    energyKcal: number;
    carbohydrates: number;
    sugars: number;
    proteins: number;
    totalFat: number;
    saturatedFat: number;
    salt: number;
    sodium: number;
    fiber: number;
  };
}
