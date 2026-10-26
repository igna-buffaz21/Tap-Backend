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
exports.SendMessageDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class TextDto {
    body = undefined;
    preview_url;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Contenido del mensaje de texto',
        example: 'Hola, este es un mensaje de prueba',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TextDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Mostrar vista previa del enlace',
        example: 'true',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TextDto.prototype, "preview_url", void 0);
class TemplateLanguageDto {
    code = undefined;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Código de idioma ISO 639-1',
        example: 'es',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TemplateLanguageDto.prototype, "code", void 0);
class TemplateDto {
    name = undefined;
    language = undefined;
    components;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nombre del template de WhatsApp',
        example: 'reminder_appointment',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TemplateDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Configuración de idioma del template',
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => TemplateLanguageDto),
    __metadata("design:type", TemplateLanguageDto)
], TemplateDto.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Componentes adicionales del template',
        type: [Object],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], TemplateDto.prototype, "components", void 0);
class ImageDto {
    link;
    id;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'URL de la imagen a enviar',
        example: 'https://ejemplo.com/imagen.jpg',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ImageDto.prototype, "link", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID de la imagen (si ya fue subida)',
        example: '123456789',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ImageDto.prototype, "id", void 0);
class DocumentDto {
    link;
    id;
    filename;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'URL del documento a enviar',
        example: 'https://ejemplo.com/documento.pdf',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DocumentDto.prototype, "link", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID del documento (si ya fue subido)',
        example: '123456789',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DocumentDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nombre del archivo a mostrar',
        example: 'documento.pdf',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DocumentDto.prototype, "filename", void 0);
class InteractiveButtonReplyDto {
    id = undefined;
    title = undefined;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID único del botón',
        example: 'confirm_button_1',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InteractiveButtonReplyDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Texto del botón',
        example: 'Confirmar',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InteractiveButtonReplyDto.prototype, "title", void 0);
class InteractiveButtonDto {
    type = undefined;
    reply = undefined;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tipo de botón (siempre "reply")',
        example: 'reply',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InteractiveButtonDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Contenido del botón de respuesta',
        type: InteractiveButtonReplyDto,
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => InteractiveButtonReplyDto),
    __metadata("design:type", InteractiveButtonReplyDto)
], InteractiveButtonDto.prototype, "reply", void 0);
class InteractiveListRowDto {
    id = undefined;
    title = undefined;
    description;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID unico de la fila',
        example: 'slot_1',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InteractiveListRowDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Titulo visible de la fila',
        example: '21:00 - Cancha 1',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InteractiveListRowDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Descripcion opcional de la fila',
        example: 'Alquiler cancha F7 60 min',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InteractiveListRowDto.prototype, "description", void 0);
class InteractiveListSectionDto {
    title = undefined;
    rows = undefined;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Titulo de la seccion',
        example: 'Horarios disponibles',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InteractiveListSectionDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Opciones de la lista',
        type: [InteractiveListRowDto],
    }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => InteractiveListRowDto),
    __metadata("design:type", Array)
], InteractiveListSectionDto.prototype, "rows", void 0);
class InteractiveFooterDto {
    text = undefined;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Texto del pie de página',
        example: 'Selecciona una opción',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InteractiveFooterDto.prototype, "text", void 0);
class InteractiveBodyDto {
    text = undefined;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Contenido del mensaje interactivo',
        example: '¿Deseas confirmar tu cita?',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InteractiveBodyDto.prototype, "text", void 0);
class InteractiveDto {
    type = undefined;
    body = undefined;
    action;
    footer;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tipo de mensaje interactivo ("button" o "list")',
        example: 'list',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InteractiveDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Contenido del cuerpo del mensaje',
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => InteractiveBodyDto),
    __metadata("design:type", InteractiveBodyDto)
], InteractiveDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Acciones disponibles (botones o lista)',
    }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], InteractiveDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Pie de página opcional',
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => InteractiveFooterDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", InteractiveFooterDto)
], InteractiveDto.prototype, "footer", void 0);
class SendMessageDto {
    id;
    whatsappAccountId;
    phoneNumberId;
    businessId;
    conversationId;
    messaging_product = undefined;
    to = undefined;
    type = undefined;
    text;
    image;
    document;
    template;
    interactive;
}
exports.SendMessageDto = SendMessageDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Alias corto para pruebas: ID interno de whatsapp_account o phone_number guardado del numero emisor.',
        example: '1282534091605774',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], SendMessageDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID interno de whatsapp_account. Define la cuenta/número de Meta usada para enviar.',
        example: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SendMessageDto.prototype, "whatsappAccountId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Alias compatible para buscar por whatsapp_account.phone_number.',
        example: '1282534091605774',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "phoneNumberId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID interno del negocio. Se usa solo para persistir el mensaje, no se envia a Meta.',
        example: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SendMessageDto.prototype, "businessId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID interno de la conversacion. Se usa solo para persistir el mensaje, no se envia a Meta.',
        example: 10,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SendMessageDto.prototype, "conversationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Producto de mensajería (siempre "whatsapp")',
        example: 'whatsapp',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "messaging_product", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Número de teléfono del destinatario (código país + número)',
        example: '5491234567890',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tipo de mensaje: text, template, image, document, interactive',
        enum: ['text', 'template', 'image', 'document', 'interactive'],
        example: 'text',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Contenido para mensajes de texto',
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => TextDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", TextDto)
], SendMessageDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Imagen a enviar',
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ImageDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", ImageDto)
], SendMessageDto.prototype, "image", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Documento a enviar',
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DocumentDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", DocumentDto)
], SendMessageDto.prototype, "document", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Template de WhatsApp a enviar',
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => TemplateDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", TemplateDto)
], SendMessageDto.prototype, "template", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Mensaje interactivo (botones o lista)',
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => InteractiveDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", InteractiveDto)
], SendMessageDto.prototype, "interactive", void 0);
//# sourceMappingURL=send-message.dto.js.map