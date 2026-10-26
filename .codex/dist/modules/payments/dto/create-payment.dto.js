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
exports.CreatePaymentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CreatePaymentDto {
    booking_id;
    amount;
    method;
    status;
    paid_at;
    reference;
}
exports.CreatePaymentDto = CreatePaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], CreatePaymentDto.prototype, "booking_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 12500 }),
    __metadata("design:type", Number)
], CreatePaymentDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ['CASH', 'TRANSFER', 'CARD', 'MERCADO_PAGO', 'OTHER'],
        example: 'CASH',
    }),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['PENDING', 'PAID'], default: 'PAID' }),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-08-17T20:00:00-03:00' }),
    __metadata("design:type", Object)
], CreatePaymentDto.prototype, "paid_at", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Comprobante 123' }),
    __metadata("design:type", Object)
], CreatePaymentDto.prototype, "reference", void 0);
//# sourceMappingURL=create-payment.dto.js.map