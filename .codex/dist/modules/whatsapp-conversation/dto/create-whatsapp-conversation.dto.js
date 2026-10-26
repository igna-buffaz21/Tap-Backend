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
exports.CreateWhatsappConversationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CreateWhatsappConversationDto {
    whatsappAccountId;
    businessId;
    branchId;
    customerId;
    lastMessageAt;
    expiresAt;
}
exports.CreateWhatsappConversationDto = CreateWhatsappConversationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], CreateWhatsappConversationDto.prototype, "whatsappAccountId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], CreateWhatsappConversationDto.prototype, "businessId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2, nullable: true }),
    __metadata("design:type", Object)
], CreateWhatsappConversationDto.prototype, "branchId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 20 }),
    __metadata("design:type", Number)
], CreateWhatsappConversationDto.prototype, "customerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-08-19T15:30:00.000Z' }),
    __metadata("design:type", String)
], CreateWhatsappConversationDto.prototype, "lastMessageAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-08-20T15:30:00.000Z', nullable: true }),
    __metadata("design:type", Object)
], CreateWhatsappConversationDto.prototype, "expiresAt", void 0);
//# sourceMappingURL=create-whatsapp-conversation.dto.js.map