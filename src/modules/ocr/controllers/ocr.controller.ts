import { Controller, Post, UseInterceptors, UploadedFile, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { OcrService } from '../services/ocr.service';
import { OcrResponseDto } from '../dto/ocr-response.dto';

@ApiTags('OCR')
@Controller('ocr')
export class OcrController {
    constructor(private readonly ocrService: OcrService) { }

    @Post('process')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('image'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Subir una fotografía de etiqueta nutricional para extraer texto e ingredientes' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                image: { type: 'string', format: 'binary', description: 'Archivo de imagen (JPEG/PNG)' },
                barcode: { type: 'string', description: 'Código de barras del producto asociado (Opcional)' },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Texto digitalizado con éxito.', type: OcrResponseDto })
    @ApiResponse({ status: 400, description: 'Archivo inválido o texto ilegible.' })
    async processLabel(
        @UploadedFile() file: Express.Multer.File,
        @Body('barcode') barcode?: string,
    ): Promise<OcrResponseDto> {
        return await this.ocrService.processLabelImage(file, barcode);
    }
}