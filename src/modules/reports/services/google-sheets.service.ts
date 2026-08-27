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

    const email = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const rawKey = this.configService.get<string>('GOOGLE_PRIVATE_KEY');

    // Sanitización exhaustiva de la clave privada para OpenSSL
    const privateKey = rawKey
      ? rawKey
          .trim()
          .replace(/^["']/g, '')
          .replace(/["']$/g, '')
          .replace(/\\n/g, '\n')
          .replace(/\r/g, '')
      : undefined;

    if (!email || !privateKey) {
      this.logger.warn(
        'Las credenciales de Google Sheets no están completamente configuradas en el .env',
      );
      return;
    }

    try {
      this.authClient = new google.auth.JWT({
        email: email,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } catch (err: any) {
      this.logger.error(`Error al construir cliente JWT de Google: ${err.message}`);
    }
  }

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
        range: `${sheetName}!A:I`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowValues],
        },
      });

      this.logger.log('Fila agregada exitosamente a Google Sheets.');
    } catch (error: any) {
      this.logger.error(`Error al sincronizar con Google Sheets API: ${error.message}`);
      throw new InternalServerErrorException('Fallo en la sincronización del Dashboard escolar.');
    }
  }
}
