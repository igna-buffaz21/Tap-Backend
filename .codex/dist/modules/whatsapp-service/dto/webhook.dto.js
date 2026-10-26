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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class MessageDto {
    id = undefined;
    type = undefined;
    timestamp = undefined;
    text;
    interactive;
    image;
    document;
    audio;
    video;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID único del mensaje',
        example: 'wamid.123456789',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MessageDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tipo de mensaje (text, image, document, audio, video, interactive)',
        example: 'text',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MessageDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Timestamp del mensaje en segundos UNIX',
        example: '1629914800',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MessageDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Contenido si es un mensaje de texto',
        example: { body: 'Hola, necesito una cita' },
    }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], MessageDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Contenido si es un mensaje interactivo',
    }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], MessageDto.prototype, "interactive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Metadatos de imagen si aplica',
    }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], MessageDto.prototype, "image", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Metadatos de documento si aplica',
    }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], MessageDto.prototype, "document", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Metadatos de audio si aplica',
    }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], MessageDto.prototype, "audio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Metadatos de video si aplica',
    }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], MessageDto.prototype, "video", void 0);
class StatusDto {
    id = undefined;
    status = undefined;
    timestamp = undefined;
    recipient_id;
    errors;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID del mensaje',
        example: 'wamid.123456789',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StatusDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Estado del mensaje (sent, delivered, read, failed)',
        example: 'delivered',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Timestamp del cambio de estado',
        example: '1629914800',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StatusDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID del destinatario',
    }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], StatusDto.prototype, "recipient_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Errores asociados al mensaje si aplica',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => Object),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], StatusDto.prototype, "errors", void 0);
class ContactDto {
    wa_id = undefined;
    profile = undefined;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID de WhatsApp del contacto',
        example: '1234567890',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactDto.prototype, "wa_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Información del perfil del contacto',
        example: { name: 'Juan Pérez' },
    }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], ContactDto.prototype, "profile", void 0);
class ChangeValueDto {
    messaging_product = undefined;
    messages;
    statuses;
    contacts;
    metadata = undefined;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Producto de mensajería',
        example: 'whatsapp',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChangeValueDto.prototype, "messaging_product", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Array de mensajes recibidos',
        type: [MessageDto],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => MessageDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ChangeValueDto.prototype, "messages", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Array de cambios de estado de mensajes',
        type: [StatusDto],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => StatusDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ChangeValueDto.prototype, "statuses", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Array de contactos involucrados',
        type: [ContactDto],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ContactDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ChangeValueDto.prototype, "contacts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Metadatos del webhook',
        example: {
            display_phone_number: '549123456789',
            phone_number_id: '1234567890',
        },
    }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], ChangeValueDto.prototype, "metadata", void 0);
class ChangeDto {
    field = undefined;
    value = undefined;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Campo modificado en el webhook',
        example: 'messages',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChangeDto.prototype, "field", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Valores asociados al cambio',
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ChangeValueDto),
    __metadata("design:type", ChangeValueDto)
], ChangeDto.prototype, "value", void 0);
class EntryDto {
    id = undefined;
    changes = undefined;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID de la entrada',
        example: '123456789',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EntryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array de cambios en esta entrada',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ChangeDto),
    __metadata("design:type", Array)
], EntryDto.prototype, "changes", void 0);
class WebhookDto {
    object = undefined;
    entry = undefined;
}
exports.WebhookDto = WebhookDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tipo de objeto del webhook',
        example: 'whatsapp_business_account',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WebhookDto.prototype, "object", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array de entradas con cambios',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => EntryDto),
    __metadata("design:type", Array)
], WebhookDto.prototype, "entry", void 0);
//# sourceMappingURL=webhook.dto.js.map