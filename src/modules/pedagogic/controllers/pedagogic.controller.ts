import { Controller, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PedagogicService } from '../services/pedagogic.service';
import { EvaluationResponseDto } from '../dto/evaluation-response.dto';

@ApiTags('Pedagogic & Gamification')
@Controller('pedagogic')
export class PedagogicController {
    constructor(private readonly pedagogicService: PedagogicService) { }

    @Get('evaluate/:barcode')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Obtener análisis pedagógico y cálculo de Nutri-Puntos para un estudiante' })
    @ApiResponse({ status: 200, description: 'Evaluación pedagógica devuelta con éxito.', type: EvaluationResponseDto })
    @ApiResponse({ status: 404, description: 'El producto especificado no existe o no tiene datos de semáforo.' })
    async evaluate(@Param('barcode') barcode: string): Promise<EvaluationResponseDto> {
        return await this.pedagogicService.evaluateProductForStudent(barcode);
    }
}