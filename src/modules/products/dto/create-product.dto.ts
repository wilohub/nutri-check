import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class NutritionalDataDto {
    @ApiProperty({ example: 120.5 })
    @IsNumber()
    energyKcal!: number;

    @ApiProperty({ example: 15.2 })
    @IsNumber()
    carbohydrates!: number;

    @ApiProperty({ example: 8.4 })
    @IsNumber()
    sugars!: number;

    @ApiProperty({ example: 3.1 })
    @IsNumber()
    proteins!: number;

    @ApiProperty({ example: 4.5 })
    @IsNumber()
    totalFat!: number;

    @ApiProperty({ example: 1.2 })
    @IsNumber()
    saturatedFat!: number;

    @ApiProperty({ example: 0.05 })
    @IsNumber()
    salt!: number;

    @ApiProperty({ example: 0.05 })
    @IsNumber()
    sodium!: number;

    @ApiProperty({ example: 2.1 })
    @IsNumber()
    fiber!: number;
}

export class CreateProductDto {
    @ApiProperty({ example: '7441002501024', description: 'Código de barras único' })
    @IsString()
    @IsNotEmpty()
    barcode!: string;

    @ApiProperty({ example: 'Leche Semidescremada', description: 'Nombre del producto' })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ example: 'Dos Pinos', required: false })
    @IsString()
    @IsOptional()
    brand?: string;

    @ApiProperty({ example: 'https://images.images.com/photo.jpg', required: false })
    @IsString()
    @IsOptional()
    imageUrl?: string;

    @ApiProperty({ example: 'Leche fluida pasteurizada, Vitamina A', required: false })
    @IsString()
    @IsOptional()
    ingredients?: string;

    @ApiProperty({ description: 'Datos nutricionales por cada 100g/ml' })
    @ValidateNested()
    @Type(() => NutritionalDataDto)
    @IsNotEmpty()
    nutritionalData!: NutritionalDataDto;
}