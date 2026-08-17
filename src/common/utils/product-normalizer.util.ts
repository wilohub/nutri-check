function mapTrafficLight(level: string): 'ALTO' | 'MEDIO' | 'BAJO' {
  if (!level) return 'BAJO';
  const l = level.toLowerCase();
  if (l === 'high' || l === 'alto') return 'ALTO';
  if (l === 'moderate' || l === 'medio') return 'MEDIO';
  return 'BAJO';
}

export function normalizeProductData(rawProduct: any, source: 'local' | 'off') {
  let name = '';
  let brand = '';
  let imageUrl = '';
  let quantityNum = 0;
  let quantityUnit = 'g'; // 'g' o 'ml'

  let sugars100 = 0;
  let fat100 = 0;
  let satFat100 = 0;
  let sodium100 = 0; // en gramos de sal

  let trafficLightSugar: 'ALTO' | 'MEDIO' | 'BAJO' = 'BAJO';
  let trafficLightSatFat: 'ALTO' | 'MEDIO' | 'BAJO' = 'BAJO';
  let trafficLightSodium: 'ALTO' | 'MEDIO' | 'BAJO' = 'BAJO';

  if (source === 'off') {
    name = rawProduct.product_name || rawProduct.name || 'Producto Desconocido';
    brand = rawProduct.brands || rawProduct.brand || 'Marca no especificada';
    imageUrl = rawProduct.image_front_url || rawProduct.image_url || '';

    // Extracción de cantidad y unidad
    quantityNum = rawProduct.product_quantity || 100;
    quantityUnit = (rawProduct.product_quantity_unit || 'g').toLowerCase();

    // Nutrientes por 100g / 100ml
    const nutriments = rawProduct.nutriments || {};
    sugars100 = nutriments['sugars_100g'] || 0;
    fat100 = nutriments['fat_100g'] || 0;
    satFat100 = nutriments['saturated-fat_100g'] || 0;
    sodium100 =
      nutriments['salt_100g'] || (nutriments['sodium_100g'] ? nutriments['sodium_100g'] * 2.5 : 0);

    // Semáforo OFF (nutrient_levels)
    const levels = rawProduct.nutrient_levels || {};
    trafficLightSugar = mapTrafficLight(levels['sugars']);
    trafficLightSatFat = mapTrafficLight(levels['saturated-fat']);
    trafficLightSodium = mapTrafficLight(levels['salt']);
  } else {
    // Estructura DB Local
    name = rawProduct.name;
    brand = rawProduct.brand;
    imageUrl = rawProduct.imageUrl || '';
    quantityNum = rawProduct.quantityNum || 100;
    quantityUnit = (rawProduct.quantityUnit || 'g').toLowerCase();

    const nut = rawProduct.nutritionalData || {};
    sugars100 = nut.sugars100g || 0;
    fat100 = nut.totalFat100g || 0;
    satFat100 = nut.saturatedFat100g || 0;
    sodium100 = nut.salt100g || 0;

    trafficLightSugar = nut.trafficLightSugar || 'BAJO';
    trafficLightSatFat = nut.trafficLightSaturatedFat || 'BAJO';
    trafficLightSodium = nut.trafficLightSodium || 'BAJO';
  }

  // Cálculos Pedagógicos Adaptativos
  const isLiquid = quantityUnit === 'ml';
  const portionSize = isLiquid ? 200 : 15; // 200 ml (1 vaso) vs 15 g (1 cucharada)
  const portionLabel = isLiquid ? '1 vaso (200 ml)' : '1 cucharada (15 g)';

  const sugarPerPortion = (sugars100 * portionSize) / 100;
  const teaspoonsPerPortion = Math.round(sugarPerPortion / 4);

  return {
    name,
    brand,
    imageUrl,
    quantityNum,
    quantityUnit,
    isLiquid,
    portionSize,
    portionLabel,
    nutrients: {
      sugars100,
      fat100,
      satFat100,
      sodium100,
      sugarPerPortion: Number(sugarPerPortion.toFixed(1)),
      teaspoonsPerPortion,
    },
    trafficLight: {
      sugar: trafficLightSugar,
      satFat: trafficLightSatFat,
      sodium: trafficLightSodium,
    },
  };
}
