import { Module, Global } from '@nestjs/common';
import { GoogleSheetsService } from './services/google-sheets.service';

@Global() // Lo hacemos global para que cualquier módulo (como Products) pueda usarlo sin re-importar
@Module({
    providers: [GoogleSheetsService],
    exports: [GoogleSheetsService],
})
export class ReportsModule { }