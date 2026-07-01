import { Controller, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PedagogicService } from '../services/pedagogic.service';
import { EvaluationResponseDto } from '../dto/evaluation-response.dto';

@ApiTags('Concientización Ciudadana')
@Controller('pedagogic')
export class PedagogicController {
    constructor(private readonly pedagogicService: PedagogicService) { }

    @Get('evaluate/:barcode')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Obtener equivalencias físicas y ejercicio requerido para concientización pública' })
    @ApiResponse({ status: 200, type: EvaluationResponseDto })
    async evaluate(@Param('barcode') barcode: string): Promise<EvaluationResponseDto> {
        return await this.pedagogicService.evaluateProductForCitizen(barcode);
    }
}