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
exports.InterpretWhatsappMessageDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const whatsapp_conversation_entity_1 = require("../../whatsapp-conversation/entities/whatsapp-conversation.entity");
class InterpretWhatsappMessageDto {
    messageText;
    currentIntent;
    currentStatus;
    currentContext;
    businessId;
    branchId;
    recentMessages;
}
exports.InterpretWhatsappMessageDto = InterpretWhatsappMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Quiero una cancha mañana tipo 18' }),
    __metadata("design:type", String)
], InterpretWhatsappMessageDto.prototype, "messageText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: whatsapp_conversation_entity_1.WhatsappConversationIntent,
        example: whatsapp_conversation_entity_1.WhatsappConversationIntent.UNKNOWN,
    }),
    __metadata("design:type", String)
], InterpretWhatsappMessageDto.prototype, "currentIntent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: whatsapp_conversation_entity_1.WhatsappConversationStatus,
        example: whatsapp_conversation_entity_1.WhatsappConversationStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], InterpretWhatsappMessageDto.prototype, "currentStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: {
            date: '2026-08-20',
            serviceId: 3,
        },
    }),
    __metadata("design:type", Object)
], InterpretWhatsappMessageDto.prototype, "currentContext", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], InterpretWhatsappMessageDto.prototype, "businessId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2, nullable: true }),
    __metadata("design:type", Object)
], InterpretWhatsappMessageDto.prototype, "branchId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: ['Usuario: hola', 'Bot: Hola, que turno necesitas?'],
    }),
    __metadata("design:type", Array)
], InterpretWhatsappMessageDto.prototype, "recentMessages", void 0);
//# sourceMappingURL=interpret-whatsapp-message.dto.js.map