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
exports.CreateWhatsappAccountDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CreateWhatsappAccountDto {
    business_id;
    branch_id;
    phone_number;
    phone_number_id;
    waba_id;
    meta_business_id;
    access_token;
    status;
}
exports.CreateWhatsappAccountDto = CreateWhatsappAccountDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 1,
        description: 'ID del negocio.',
    }),
    __metadata("design:type", Number)
], CreateWhatsappAccountDto.prototype, "business_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2 }),
    __metadata("design:type", Number)
], CreateWhatsappAccountDto.prototype, "branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '1282534091605774',
        description: 'Numero de WhatsApp conectado o alias legado.',
    }),
    __metadata("design:type", String)
], CreateWhatsappAccountDto.prototype, "phone_number", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '1282534091605774',
        description: 'ID Meta del numero de telefono que llega en el webhook.',
    }),
    __metadata("design:type", Object)
], CreateWhatsappAccountDto.prototype, "phone_number_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456789012345' }),
    __metadata("design:type", String)
], CreateWhatsappAccountDto.prototype, "waba_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '987654321098765' }),
    __metadata("design:type", Object)
], CreateWhatsappAccountDto.prototype, "meta_business_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'EAA...',
        description: 'Token de acceso de Meta para este numero de WhatsApp.',
    }),
    __metadata("design:type", String)
], CreateWhatsappAccountDto.prototype, "access_token", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'ACTIVE', default: 'ACTIVE' }),
    __metadata("design:type", String)
], CreateWhatsappAccountDto.prototype, "status", void 0);
//# sourceMappingURL=create-whatsapp-account.dto.js.map