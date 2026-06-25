import { Controller, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OpenFoodFactsService } from '../services/open-food-facts.service';
import { ExternalProductResponseDto } from '../dto/external-product-response.dto';

@ApiTags('Open Food Facts')
@Controller('open-food-facts')
export class OpenFoodFactsController {
    constructor(private readonly openFoodFactsService: OpenFoodFactsService) { }

    @Get(':barcode')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Consultar información de un producto directamente en Open Food Facts' })
    @ApiResponse({ status: 200, description: 'Producto encontrado con éxito.', type: ExternalProductResponseDto })
    @ApiResponse({ status: 404, description: 'El producto no existe en la base de datos externa.' })
    @ApiResponse({ status: 502, description: 'Fallo de pasarela (error al conectar con Open Food Facts).' })
    async getExternalProduct(
        @Param('barcode') barcode: string,
    ): Promise<ExternalProductResponseDto> {
        return await this.openFoodFactsService.fetchProductByBarcode(barcode);
    }
}