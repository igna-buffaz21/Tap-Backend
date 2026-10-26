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
exports.CreateOutboundWhatsappMessageDto = exports.CreateInboundWhatsappMessageDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CreateInboundWhatsappMessageDto {
    businessId;
    conversationId;
    messageType;
    providerMessageId;
    content;
    receivedAt;
}
exports.CreateInboundWhatsappMessageDto = CreateInboundWhatsappMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], CreateInboundWhatsappMessageDto.prototype, "businessId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10 }),
    __metadata("design:type", Number)
], CreateInboundWhatsappMessageDto.prototype, "conversationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'text' }),
    __metadata("design:type", String)
], CreateInboundWhatsappMessageDto.prototype, "messageType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'wamid.HBgNNTQ5MzUx...' }),
    __metadata("design:type", Object)
], CreateInboundWhatsappMessageDto.prototype, "providerMessageId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: {
            text: 'Hola, quiero una cancha hoy a las 18',
        },
    }),
    __metadata("design:type", Object)
], CreateInboundWhatsappMessageDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-08-19T15:30:00.000Z' }),
    __metadata("design:type", String)
], CreateInboundWhatsappMessageDto.prototype, "receivedAt", void 0);
class CreateOutboundWhatsappMessageDto {
    businessId;
    conversationId;
    messageType;
    providerMessageId;
    content;
}
exports.CreateOutboundWhatsappMessageDto = CreateOutboundWhatsappMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], CreateOutboundWhatsappMessageDto.prototype, "businessId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10 }),
    __metadata("design:type", Number)
], CreateOutboundWhatsappMessageDto.prototype, "conversationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'text' }),
    __metadata("design:type", String)
], CreateOutboundWhatsappMessageDto.prototype, "messageType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'wamid.HBgNNTQ5MzUx...' }),
    __metadata("design:type", Object)
], CreateOutboundWhatsappMessageDto.prototype, "providerMessageId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: {
            text: 'Tengo disponibilidad a las 18:00.',
        },
    }),
    __metadata("design:type", Object)
], CreateOutboundWhatsappMessageDto.prototype, "content", void 0);
//# sourceMappingURL=create-whatsapp-message.dto.js.map