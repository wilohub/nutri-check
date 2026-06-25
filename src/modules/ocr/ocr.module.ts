import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OcrController } from './controllers/ocr.controller';
import { OcrService } from './services/ocr.service';
import { PrismaService } from '../../providers/database/prisma.service';

@Module({
    imports: [
        HttpModule.register({
            timeout: 15000, // El procesamiento de imágenes puede tomar más tiempo, configuramos 15 segundos max.
        }),
    ],
    controllers: [OcrController],
    providers: [OcrService, PrismaService],
})
export class OcrModule { }