import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

@Injectable()
export class GoogleSheetsService {
    private readonly logger = new Logger(GoogleSheetsService.name);
    private authClient: any;
    private spreadsheetId: string;

    constructor(private readonly configService: ConfigService) {
        this.spreadsheetId = this.configService.get<string>('GOOGLE_SHEETS_SPREADSHEET_ID')!;

        // Configurar el cliente JWT con las variables de entorno de la Service Account
        const email = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_EMAIL');
        // const privateKey = this.configService.get<string>('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

        const rawKey = this.configService.get<string>('GOOGLE_PRIVATE_KEY');
        // Elimina comillas accidentales que se hayan guardado en el string y repara TODOS los saltos de línea (\n)
        const privateKey = rawKey
            ? rawKey.replace(/^"/, '').replace(/"$/, '').replace(/\\n/g, '\n')
            : undefined;

        if (!email || !privateKey) {
            this.logger.warn('Las credenciales de Google Sheets no están completamente configuradas en el .env');
            return;
        }

        this.authClient = new google.auth.JWT({
            email: email,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
    }

    /**
     * Inserta una nueva fila de datos en una pestaña específica de Google Sheets
     * @param sheetName Nombre de la pestaña (ej: 'Log Escaneos')
     * @param rowValues Arreglo con los valores de las columnas en orden
     */
    async appendRow(sheetName: string, rowValues: any[]): Promise<void> {
        if (!this.authClient) {
            this.logger.error('No se puede sincronizar con Google Sheets: Cliente no autenticado.');
            return;
        }

        try {
            this.logger.log(`Enviando fila asíncrona a Google Sheets -> Pestaña: ${sheetName}`);
            const sheets = google.sheets({ version: 'v4', auth: this.authClient });

            await sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!A:Z`,
                valueInputOption: 'USER_ENTERED', // Interpreta números y fechas automáticamente
                requestBody: {
                    values: [rowValues],
                },
            });

            this.logger.log('Fila agregada exitosamente a Google Sheets.');
        } catch (error: any) {
            this.logger.error(`Error al sincronizar con Google Sheets API: ${error.message}`);
            // Lanzamos una excepción interna por si requerimos control de flujo, 
            // pero idealmente no debe tumbar la respuesta del cliente móvil.
            throw new InternalServerErrorException('Fallo en la sincronización del Dashboard escolar.');
        }
    }
}