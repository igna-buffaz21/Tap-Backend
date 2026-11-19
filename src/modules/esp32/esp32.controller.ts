import {
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Sse,
} from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import type { Observable } from 'rxjs';
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
  SensorStatus,
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

  @Get('sensor')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Consultar el sensor para iniciar el flujo automáticamente',
    description:
      'Consulta puntual del sensor. Para recibir cambios en tiempo real usar GET /esp32/sensor/events. confirmed indica una detección continua de al menos 1 segundo. ready indica que hay una detección confirmada sin procesar y el lector está libre. No mueve la puerta.',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['detected', 'confirmed', 'ready', 'busy'],
      properties: {
        detected: { type: 'boolean', nullable: true },
        confirmed: { type: 'boolean' },
        ready: { type: 'boolean' },
        busy: { type: 'boolean' },
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'No se pudo conectar con el ESP32.',
  })
  getSensorStatus(): Promise<SensorStatus> {
    return this.reader.getSensorStatus();
  }

  @Sse('sensor/events')
  @Header('Cache-Control', 'no-cache, no-transform')
  @Header('X-Accel-Buffering', 'no')
  @ApiOperation({
    summary: 'Recibir el sensor y el progreso del flujo por SSE',
    description:
      'Requiere Bearer token. Emite sensor con el estado actual al conectar y al cambiar, incluida la confirmación de 1 segundo; flow con stage; heartbeat cada 15 segundos; hardwareError y cierre del stream si falla el hardware. Iniciar POST /esp32/run-flow cuando sensor.ready sea true. Reconectar ante un cierre; la reconexión entrega el estado actual, sin reproducir eventos anteriores. Cerrar el stream no cancela un flujo iniciado por POST.',
  })
  @ApiOkResponse({
    description:
      'Stream SSE con eventos sensor, flow, heartbeat y hardwareError.',
    content: { 'text/event-stream': { schema: { type: 'string' } } },
  })
  sensorEvents(): Observable<MessageEvent> {
    return this.reader.observeSensor();
  }

  @Post('run-flow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ejecutar el flujo de puerta y lectura RFID',
    description:
      'Requiere una nueva detección del sensor estable durante al menos 1 segundo (evento SSE sensor con ready=true). Abre la puerta, espera 3 segundos y la cierra, lee EPC únicos durante 5 segundos en ANT4 y vuelve a abrirla. Busca los productos por los 8 caracteres de producto de cada EPC dentro del negocio autenticado. Devuelve una entrada por EPC y product=null si no hay coincidencia o el formato es inválido. Cada detección se procesa una sola vez; debe retirarse el objeto para habilitar otra. No registra ventas.',
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
    description: 'El lector está ocupado o no hay una nueva detección estable.',
  })
  @ApiServiceUnavailableResponse({
    description:
      'No se pudo completar el flujo o confirmar una operación del hardware.',
  })
  runFlow(@CurrentUser() currentUser: User): Promise<RfidProductFlowResult> {
    return this.productIdentifications.resolveRfidFlowForBusiness(
      currentUser,
      () => this.reader.runFlow(undefined, { sensorTriggered: true }),
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
