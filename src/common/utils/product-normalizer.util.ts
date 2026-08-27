import { Product, NutritionalData } from '@prisma/client';
import { ExternalProductResponseDto } from '../../modules/open-food-facts/dto/external-product-response.dto';

export function mapLocalProductToExternalDto(
  localProduct: Product & { nutritionalData: NutritionalData | null },
): ExternalProductResponseDto {
  const nut = localProduct.nutritionalData;

  return {
    barcode: localProduct.barcode,
    name: localProduct.name,
    brand: localProduct.brand || 'Marca no especificada',
    productType: 'food',
    imageUrl: localProduct.imageUrl || '',
    ingredients: localProduct.ingredients || 'No especificados',
    quantityData: {
      display: '100 g',
      value: 100,
      unit: 'g',
    },
    servingQuantityData: {
      display: '15 g',
      value: 15,
      unit: 'g',
    },
    nutrientLevels: {
      fat: (nut?.trafficLightSaturatedFat || 'BAJO').toLowerCase(),
      salt: (nut?.trafficLightSalt || nut?.trafficLightSodium || 'BAJO').toLowerCase(),
      saturatedFat: (nut?.trafficLightSaturatedFat || 'BAJO').toLowerCase(),
      sugars: (nut?.trafficLightSugar || 'BAJO').toLowerCase(),
    },
    nutritionalData: {
      carbohydrates: nut ? { unit: 'g', value: nut.carbohydrates } : null,
      cholesterol: null,
      energy: null,
      energyKcal: nut ? { unit: 'kcal', value: nut.energyKcal } : null,
      energyKj: null,
      fiber: nut ? { unit: 'g', value: nut.fiber } : null,
      proteins: nut ? { unit: 'g', value: nut.proteins } : null,
      salt: nut ? { unit: 'g', value: nut.salt } : null,
      saturatedFat: nut ? { unit: 'g', value: nut.saturatedFat } : null,
      sodium: nut ? { unit: 'g', value: nut.sodium } : null,
      sugars: nut ? { unit: 'g', value: nut.sugars } : null,
      totalFat: nut ? { unit: 'g', value: nut.totalFat } : null,
    },
  };
}
