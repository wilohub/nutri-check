export interface NormalizedNutrients {
  sugars100: number;
  fat100: number;
  satFat100: number;
  sodium100: number;
  sugarPerPortion: number;
  teaspoonsPerPortion: number;
}

export interface NormalizedTrafficLight {
  sugar: 'ALTO' | 'MEDIO' | 'BAJO';
  satFat: 'ALTO' | 'MEDIO' | 'BAJO';
  sodium: 'ALTO' | 'MEDIO' | 'BAJO';
}

export interface NormalizedProductResponse {
  name: string;
  brand: string;
  imageUrl: string;
  quantityNum: number;
  quantityUnit: string;
  isLiquid: boolean;
  portionSize: number;
  portionLabel: string;
  nutrients: NormalizedNutrients;
  trafficLight: NormalizedTrafficLight;
}
