import { ExternalProductResponseDto } from '../../open-food-facts/dto/external-product-response.dto';

export interface ScanProductResponse {
  source: 'local' | 'off';
  data: ExternalProductResponseDto;
}
