"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WhatsappServiceController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappServiceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const whatsapp_service_service_1 = require("./whatsapp-service.service");
const webhook_dto_1 = require("./dto/webhook.dto");
const send_message_dto_1 = require("./dto/send-message.dto");
let WhatsappServiceController = WhatsappServiceController_1 = class WhatsappServiceController {
    whatsappService;
    logger = new common_1.Logger(WhatsappServiceController_1.name);
    constructor(whatsappService) {
        this.whatsappService = whatsappService;
    }
    receiveMessage(payload) {
        this.logger.log('POST /whatsapp/webhook recibido');
        void this.whatsappService.handleIncomingMessage(payload).catch((error) => {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Error procesando webhook asincronico:', errorMessage);
        });
        return {
            success: true,
            message: 'Webhook recibido',
        };
    }
    verifyWebhook(mode, challenge, verifyToken) {
        return this.whatsappService.verifyWebhook(mode, challenge, verifyToken);
    }
    getIaContextSnapshot(conversationId, businessId, messageText) {
        return this.whatsappService.getIaContextSnapshot(conversationId, businessId, messageText);
    }
    async sendMessage(payload) {
        return await this.whatsappService.sendMessage(payload);
    }
    async sendMessageFromSavedAccount(whatsappAccountId, payload) {
        return await this.whatsappService.sendMessage({
            ...payload,
            id: whatsappAccountId,
        });
    }
};
exports.WhatsappServiceController = WhatsappServiceController;
__decorate([
    (0, common_1.Post)('webhook'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Recibir webhooks de WhatsApp',
        description: 'Endpoint para recibir y procesar los webhooks enviados por WhatsApp. Procesa mensajes entrantes, cambios de estado de entrega, etc.',
    }),
    (0, swagger_1.ApiBody)({
        type: webhook_dto_1.WebhookDto,
        description: 'Payload del webhook de WhatsApp',
        examples: {
            text_message: {
                summary: 'Mensaje de texto entrante',
                value: {
                    object: 'whatsapp_business_account',
                    entry: [
                        {
                            id: '123456789',
                            changes: [
                                {
                                    field: 'messages',
                                    value: {
                                        messaging_product: 'whatsapp',
                                        messages: [
                                            {
                                                id: 'wamid.123456',
                                                type: 'text',
                                                timestamp: '1629914800',
                                                text: { body: 'Hola, necesito una cita' },
                                            },
                                        ],
                                        contacts: [
                                            {
                                                wa_id: '1234567890',
                                                profile: { name: 'Juan Pérez' },
                                            },
                                        ],
                                        metadata: {
                                            display_phone_number: '549123456789',
                                            phone_number_id: '1234567890',
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },
            },
            message_status: {
                summary: 'Cambio de estado de mensaje',
                value: {
                    object: 'whatsapp_business_account',
                    entry: [
                        {
                            id: '123456789',
                            changes: [
                                {
                                    field: 'messages',
                                    value: {
                                        messaging_product: 'whatsapp',
                                        statuses: [
                                            {
                                                id: 'wamid.123456',
                                                status: 'delivered',
                                                timestamp: '1629914800',
                                            },
                                        ],
                                        metadata: {
                                            display_phone_number: '549123456789',
                                            phone_number_id: '1234567890',
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Webhook procesado correctamente',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Webhook procesado' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Datos inválidos en el webhook',
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Error al procesar el webhook',
    }),
    (0, throttler_1.SkipThrottle)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [webhook_dto_1.WebhookDto]),
    __metadata("design:returntype", void 0)
], WhatsappServiceController.prototype, "receiveMessage", null);
__decorate([
    (0, common_1.Get)('webhook'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Verificar webhook de WhatsApp',
        description: 'Endpoint requerido por WhatsApp para verificar la propiedad del webhook. Responde con el challenge enviado si el token es válido.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'hub.mode',
        required: true,
        description: 'Modo de verificación (debe ser "subscribe")',
        example: 'subscribe',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'hub.challenge',
        required: true,
        description: 'Token de desafío proporcionado por WhatsApp',
        example: '1234567890abcdef',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'hub.verify_token',
        required: true,
        description: 'Token de verificación configurado en las variables de entorno (WHATSAPP_VERIFY_TOKEN)',
        example: 'tokenSeguro',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Webhook verificado exitosamente',
        schema: {
            type: 'string',
            example: '1234567890abcdef',
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Token de verificación inválido',
        schema: {
            type: 'object',
            properties: {
                error: { type: 'string', example: 'Invalid token' },
            },
        },
    }),
    (0, throttler_1.SkipThrottle)(),
    __param(0, (0, common_1.Query)('hub.mode')),
    __param(1, (0, common_1.Query)('hub.challenge')),
    __param(2, (0, common_1.Query)('hub.verify_token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], WhatsappServiceController.prototype, "verifyWebhook", null);
__decorate([
    (0, common_1.Get)('conversations/:conversationId/ia-context'),
    (0, swagger_1.ApiOperation)({
        summary: 'Ver payload de contexto que se enviaria a IA',
    }),
    (0, swagger_1.ApiParam)({ name: 'conversationId', example: 10 }),
    (0, swagger_1.ApiQuery)({ name: 'businessId', example: 1 }),
    (0, swagger_1.ApiQuery)({
        name: 'messageText',
        required: false,
        example: 'Ignacio Buffaz',
    }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Query)('businessId')),
    __param(2, (0, common_1.Query)('messageText')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], WhatsappServiceController.prototype, "getIaContextSnapshot", null);
__decorate([
    (0, common_1.Post)('send-message'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Enviar mensaje a WhatsApp',
        description: 'Endpoint para enviar mensajes a través de WhatsApp. Soporta texto, imágenes, documentos, templates y mensajes interactivos.',
    }),
    (0, swagger_1.ApiBody)({
        type: send_message_dto_1.SendMessageDto,
        description: 'Datos del mensaje a enviar',
        examples: {
            text_message_from_saved_number: {
                summary: 'Mensaje de texto desde numero guardado',
                value: {
                    id: 1,
                    messaging_product: 'whatsapp',
                    to: '5491234567890',
                    type: 'text',
                    text: {
                        body: 'Hola, este es un mensaje de prueba',
                    },
                },
            },
            text_message: {
                summary: 'Mensaje de texto simple',
                value: {
                    whatsappAccountId: 1,
                    messaging_product: 'whatsapp',
                    to: '5491234567890',
                    type: 'text',
                    text: {
                        body: 'Hola, tu cita ha sido confirmada para el 25 de agosto a las 10:00 AM',
                    },
                },
            },
            template_message: {
                summary: 'Mensaje usando template',
                value: {
                    messaging_product: 'whatsapp',
                    to: '5491234567890',
                    type: 'template',
                    template: {
                        name: 'appointment_reminder',
                        language: {
                            code: 'es',
                        },
                    },
                },
            },
            interactive_message: {
                summary: 'Mensaje con botones',
                value: {
                    messaging_product: 'whatsapp',
                    to: '5491234567890',
                    type: 'interactive',
                    interactive: {
                        type: 'button_reply',
                        body: {
                            text: '¿Deseas confirmar tu cita?',
                        },
                        action: {
                            buttons: [
                                {
                                    type: 'reply',
                                    title: 'Confirmar',
                                    id: 'confirm_1',
                                },
                                {
                                    type: 'reply',
                                    title: 'Rechazar',
                                    id: 'reject_1',
                                },
                            ],
                        },
                    },
                },
            },
            image_message: {
                summary: 'Mensaje con imagen',
                value: {
                    messaging_product: 'whatsapp',
                    to: '5491234567890',
                    type: 'image',
                    image: {
                        link: 'https://ejemplo.com/imagen.jpg',
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Mensaje enviado exitosamente',
        schema: {
            type: 'object',
            properties: {
                messages: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'string',
                                example: 'wamid.123456789',
                                description: 'ID único del mensaje enviado',
                            },
                        },
                    },
                },
                contacts: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            input: { type: 'string', example: '5491234567890' },
                            wa_id: { type: 'string', example: '5491234567890' },
                        },
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Datos inválidos o formato incorrecto',
        schema: {
            type: 'object',
            properties: {
                error: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        type: { type: 'string' },
                        code: { type: 'number' },
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Token de acceso inválido o expirado',
    }),
    (0, swagger_1.ApiResponse)({
        status: 429,
        description: 'Límite de tasa excedido (rate limit)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Error al enviar el mensaje',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_message_dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], WhatsappServiceController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('send-message/:whatsappAccountId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Enviar mensaje a WhatsApp desde una cuenta guardada',
        description: 'Atajo para pruebas: usa el id interno de whatsapp_account o el phone_number guardado en la URL y toma el access_token cifrado desde la base de datos.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'whatsappAccountId',
        description: 'ID interno de whatsapp_account o phone_number guardado del numero emisor.',
        example: '1282534091605774',
    }),
    (0, swagger_1.ApiBody)({
        type: send_message_dto_1.SendMessageDto,
        description: 'Datos del mensaje a enviar. No hace falta incluir id en el body.',
        examples: {
            text_message: {
                summary: 'Mensaje de texto simple',
                value: {
                    messaging_product: 'whatsapp',
                    to: '5491234567890',
                    type: 'text',
                    text: {
                        body: 'Hola, este es un mensaje de prueba',
                    },
                },
            },
        },
    }),
    __param(0, (0, common_1.Param)('whatsappAccountId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_message_dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], WhatsappServiceController.prototype, "sendMessageFromSavedAccount", null);
exports.WhatsappServiceController = WhatsappServiceController = WhatsappServiceController_1 = __decorate([
    (0, swagger_1.ApiTags)('whatsapp-service'),
    (0, swagger_1.ApiExcludeController)(),
    (0, common_1.Controller)('whatsapp'),
    (0, swagger_1.ApiConsumes)('application/json'),
    (0, swagger_1.ApiProduces)('application/json'),
    __metadata("design:paramtypes", [whatsapp_service_service_1.WhatsappServiceService])
], WhatsappServiceController);
//# sourceMappingURL=whatsapp-service.controller.js.map