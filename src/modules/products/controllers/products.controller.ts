import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dto/create-product.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get('scan/:barcode')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Escanear código de barras (Busca localmente, si no, consulta Open Food Facts)' })
    @ApiResponse({ status: 200, description: 'Producto obtenido exitosamente (local o externo).' })
    @ApiResponse({ status: 404, description: 'El producto no existe en ninguna base de datos.' })
    async scan(@Param('barcode') barcode: string): Promise<any> {
        return await this.productsService.scanProduct(barcode);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Guardar un producto inexistente de forma local (Flujo Post-OCR)' })
    @ApiResponse({ status: 201, description: 'Producto guardado de forma local exitosamente.' })
    @ApiResponse({ status: 409, description: 'Conflicto: El producto ya existe en la base de datos.' })
    async create(@Body() createProductDto: CreateProductDto): Promise<any> {
        return await this.productsService.createLocalProduct(createProductDto);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Listar todos los productos registrados localmente' })
    async findAll(): Promise<any> {
        return await this.productsService.getAllProducts();
    }
}