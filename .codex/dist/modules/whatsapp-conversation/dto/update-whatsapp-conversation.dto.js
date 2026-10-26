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
exports.AssignHumanDto = exports.BusinessScopedConversationDto = exports.TouchWhatsappConversationDto = exports.UpdateWhatsappConversationStateDto = exports.UpdateWhatsappConversationContextDto = exports.UpdateWhatsappConversationIntentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const whatsapp_conversation_entity_1 = require("../entities/whatsapp-conversation.entity");
class UpdateWhatsappConversationIntentDto {
    businessId;
    intent;
}
exports.UpdateWhatsappConversationIntentDto = UpdateWhatsappConversationIntentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], UpdateWhatsappConversationIntentDto.prototype, "businessId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: whatsapp_conversation_entity_1.WhatsappConversationIntent,
        example: whatsapp_conversation_entity_1.WhatsappConversationIntent.BOOKING,
    }),
    __metadata("design:type", String)
], UpdateWhatsappConversationIntentDto.prototype, "intent", void 0);
class UpdateWhatsappConversationContextDto {
    businessId;
    context;
}
exports.UpdateWhatsappConversationContextDto = UpdateWhatsappConversationContextDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], UpdateWhatsappConversationContextDto.prototype, "businessId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: {
            date: '2026-08-20',
            timePreference: {
                type: 'AROUND',
                time: '18:00',
            },
            serviceId: 3,
        },
    }),
    __metadata("design:type", Object)
], UpdateWhatsappConversationContextDto.prototype, "context", void 0);
class UpdateWhatsappConversationStateDto {
    businessId;
    intent;
    status;
    context;
    branchId;
    assignedUserId;
    lastMessageAt;
    expiresAt;
}
exports.UpdateWhatsappConversationStateDto = UpdateWhatsappConversationStateDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], UpdateWhatsappConversationStateDto.prototype, "businessId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: whatsapp_conversation_entity_1.WhatsappConversationIntent,
        example: whatsapp_conversation_entity_1.WhatsappConversationIntent.BOOKING,
    }),
    __metadata("design:type", String)
], UpdateWhatsappConversationStateDto.prototype, "intent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: whatsapp_conversation_entity_1.WhatsappConversationStatus,
        example: whatsapp_conversation_entity_1.WhatsappConversationStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], UpdateWhatsappConversationStateDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: {
            date: '2026-08-20',
            serviceId: 3,
        },
    }),
    __metadata("design:type", Object)
], UpdateWhatsappConversationStateDto.prototype, "context", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2, nullable: true }),
    __metadata("design:type", Object)
], UpdateWhatsappConversationStateDto.prototype, "branchId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 5, nullable: true }),
    __metadata("design:type", Object)
], UpdateWhatsappConversationStateDto.prototype, "assignedUserId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-08-19T15:30:00.000Z' }),
    __metadata("design:type", String)
], UpdateWhatsappConversationStateDto.prototype, "lastMessageAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-08-20T15:30:00.000Z', nullable: true }),
    __metadata("design:type", Object)
], UpdateWhatsappConversationStateDto.prototype, "expiresAt", void 0);
class TouchWhatsappConversationDto {
    businessId;
    lastMessageAt;
}
exports.TouchWhatsappConversationDto = TouchWhatsappConversationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], TouchWhatsappConversationDto.prototype, "businessId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-08-19T15:30:00.000Z' }),
    __metadata("design:type", String)
], TouchWhatsappConversationDto.prototype, "lastMessageAt", void 0);
class BusinessScopedConversationDto {
    businessId;
}
exports.BusinessScopedConversationDto = BusinessScopedConversationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], BusinessScopedConversationDto.prototype, "businessId", void 0);
class AssignHumanDto {
    businessId;
    assignedUserId;
}
exports.AssignHumanDto = AssignHumanDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], AssignHumanDto.prototype, "businessId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5 }),
    __metadata("design:type", Number)
], AssignHumanDto.prototype, "assignedUserId", void 0);
//# sourceMappingURL=update-whatsapp-conversation.dto.js.map