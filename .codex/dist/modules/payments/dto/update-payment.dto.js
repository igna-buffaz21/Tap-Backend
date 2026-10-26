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
exports.UpdatePaymentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class UpdatePaymentDto {
    booking_id;
    amount;
    status;
    method;
    paid_at;
    reference;
}
exports.UpdatePaymentDto = UpdatePaymentDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1 }),
    __metadata("design:type", Number)
], UpdatePaymentDto.prototype, "booking_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 12500 }),
    __metadata("design:type", Number)
], UpdatePaymentDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['PENDING', 'PAID', 'CANCELLED', 'REFUNDED'],
    }),
    __metadata("design:type", String)
], UpdatePaymentDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['CASH', 'TRANSFER', 'CARD', 'MERCADO_PAGO', 'OTHER'],
    }),
    __metadata("design:type", String)
], UpdatePaymentDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-08-17T20:00:00-03:00' }),
    __metadata("design:type", Object)
], UpdatePaymentDto.prototype, "paid_at", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Comprobante 123' }),
    __metadata("design:type", Object)
], UpdatePaymentDto.prototype, "reference", void 0);
//# sourceMappingURL=update-payment.dto.js.map