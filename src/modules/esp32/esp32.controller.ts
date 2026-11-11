import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Cm2000Service } from './services/cm2000.service';
import type { SingleTagReadResult } from './types/esp32.types';

@ApiTags('esp32')
@ApiBearerAuth()
@Controller('esp32')
export class Esp32Controller {
  constructor(private readonly reader: Cm2000Service) {}

  @Post('read-tag')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leer una única etiqueta RFID durante 5 segundos' })
  @ApiOkResponse({
    description:
      'Devuelve la etiqueta si se detectó exactamente un EPC distinto; con cero o varios, found es false y tag es null.',
    schema: {
      type: 'object',
      required: ['found', 'tag'],
      properties: {
        found: { type: 'boolean' },
        tag: {
          type: 'object',
          nullable: true,
          required: ['epc', 'antenna', 'rssiRaw'],
          properties: {
            epc: { type: 'string', example: 'E2000017221101441890ABCD' },
            antenna: { type: 'integer', example: 4 },
            rssiRaw: { type: 'integer', example: 100 },
          },
        },
      },
    },
  })
  @ApiConflictResponse({ description: 'El lector RFID está ocupado.' })
  @ApiServiceUnavailableResponse({
    description: 'No se pudo conectar, abrir la puerta o completar la lectura.',
  })
  readTag(): Promise<SingleTagReadResult> {
    return this.reader.readSingleTag();
  }
}
