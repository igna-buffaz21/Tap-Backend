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
exports.UpdateWhatsappMessageStatusDto = exports.UpdateWhatsappMessageProviderIdDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const whatsapp_message_entity_1 = require("../entities/whatsapp-message.entity");
class UpdateWhatsappMessageProviderIdDto {
    businessId;
    providerMessageId;
}
exports.UpdateWhatsappMessageProviderIdDto = UpdateWhatsappMessageProviderIdDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], UpdateWhatsappMessageProviderIdDto.prototype, "businessId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'wamid.HBgNNTQ5MzUx...' }),
    __metadata("design:type", String)
], UpdateWhatsappMessageProviderIdDto.prototype, "providerMessageId", void 0);
class UpdateWhatsappMessageStatusDto {
    businessId;
    providerMessageId;
    status;
}
exports.UpdateWhatsappMessageStatusDto = UpdateWhatsappMessageStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], UpdateWhatsappMessageStatusDto.prototype, "businessId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'wamid.HBgNNTQ5MzUx...' }),
    __metadata("design:type", String)
], UpdateWhatsappMessageStatusDto.prototype, "providerMessageId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: [
            whatsapp_message_entity_1.WhatsappMessageStatus.SENT,
            whatsapp_message_entity_1.WhatsappMessageStatus.DELIVERED,
            whatsapp_message_entity_1.WhatsappMessageStatus.READ,
            whatsapp_message_entity_1.WhatsappMessageStatus.FAILED,
        ],
        example: whatsapp_message_entity_1.WhatsappMessageStatus.DELIVERED,
    }),
    __metadata("design:type", String)
], UpdateWhatsappMessageStatusDto.prototype, "status", void 0);
//# sourceMappingURL=update-whatsapp-message.dto.js.map