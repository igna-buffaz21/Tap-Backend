import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ProductIdentificationsService } from '../product-identifications/product-identifications.service';
import { Cm2000Service } from './services/cm2000.service';
import type {
  RfidProductFlowResult,
  SingleTagReadResult,
} from './types/esp32.types';

@ApiTags('esp32')
@ApiBearerAuth()
@Controller('esp32')
export class Esp32Controller {
  constructor(
    private readonly reader: Cm2000Service,
    private readonly productIdentifications: ProductIdentificationsService,
  ) {}

  @Post('run-flow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ejecutar el flujo de puerta y lectura RFID',
    description:
      'Abre la puerta, espera 10 segundos, la cierra, lee EPC únicos durante 5 segundos en ANT4 y vuelve a abrirla. Busca los productos por los 8 caracteres de producto de cada EPC, usando RFID_UHF dentro del negocio autenticado. Devuelve una entrada por EPC y product=null si no hay coincidencia o el EPC no tiene el formato de 24 caracteres hexadecimales. No registra ventas.',
  })
  @ApiOkResponse({
    description: 'Flujo finalizado y apertura final confirmada por ACK.',
    schema: {
      type: 'object',
      required: ['products', 'total', 'door'],
      properties: {
        products: {
          type: 'array',
          items: {
            type: 'object',
            required: ['epc', 'product'],
            properties: {
              epc: { type: 'string', example: 'CAFE00000001000000000002' },
              product: {
                type: 'object',
                nullable: true,
                additionalProperties: true,
                description:
                  'Información completa del producto asociado a RFID_UHF 00000001 en el negocio autenticado.',
              },
            },
          },
        },
        total: { type: 'integer', example: 1 },
        door: { type: 'string', enum: ['open'] },
      },
    },
  })
  @ApiConflictResponse({
    description: 'El lector RFID está ocupado por otra lectura o flujo.',
  })
  @ApiServiceUnavailableResponse({
    description:
      'No se pudo completar el flujo o confirmar una operación del hardware.',
  })
  runFlow(@CurrentUser() currentUser: User): Promise<RfidProductFlowResult> {
    return this.productIdentifications.resolveRfidFlowForBusiness(
      currentUser,
      () => this.reader.runFlow(),
    );
  }

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
