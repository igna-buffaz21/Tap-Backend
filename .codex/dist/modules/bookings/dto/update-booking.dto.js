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
exports.UpdateBookingDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class UpdateBookingDto {
    businessId;
    business_id;
    branch_id;
    resource_id;
    customer_id;
    service_id;
    start_at;
    end_at;
    status;
    confirmation_status;
    reconfirmed_at;
    cancelled_at;
    source;
    total_price;
    reservation_name;
    notes;
}
exports.UpdateBookingDto = UpdateBookingDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 1,
        description: 'Opcional: alternativa camelCase al query param businessId.',
    }),
    __metadata("design:type", Object)
], UpdateBookingDto.prototype, "businessId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1 }),
    __metadata("design:type", Object)
], UpdateBookingDto.prototype, "business_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1 }),
    __metadata("design:type", Number)
], UpdateBookingDto.prototype, "branch_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1 }),
    __metadata("design:type", Number)
], UpdateBookingDto.prototype, "resource_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1 }),
    __metadata("design:type", Number)
], UpdateBookingDto.prototype, "customer_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1 }),
    __metadata("design:type", Number)
], UpdateBookingDto.prototype, "service_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-08-17T20:00:00-03:00' }),
    __metadata("design:type", Date)
], UpdateBookingDto.prototype, "start_at", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-08-17T21:00:00-03:00' }),
    __metadata("design:type", Date)
], UpdateBookingDto.prototype, "end_at", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
        example: 'COMPLETED',
        description: 'Usar este campo para pasar una reserva a COMPLETED.',
    }),
    __metadata("design:type", String)
], UpdateBookingDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['NOT_REQUIRED', 'PENDING', 'RECONFIRMED'] }),
    __metadata("design:type", String)
], UpdateBookingDto.prototype, "confirmation_status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-08-17T18:00:00-03:00' }),
    __metadata("design:type", Object)
], UpdateBookingDto.prototype, "reconfirmed_at", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-08-17T18:00:00-03:00' }),
    __metadata("design:type", Object)
], UpdateBookingDto.prototype, "cancelled_at", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['WEB', 'WHATSAPP', 'ADMIN'] }),
    __metadata("design:type", String)
], UpdateBookingDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 25000 }),
    __metadata("design:type", Number)
], UpdateBookingDto.prototype, "total_price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Ignacio Buffaz' }),
    __metadata("design:type", Object)
], UpdateBookingDto.prototype, "reservation_name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Reserva finalizada' }),
    __metadata("design:type", Object)
], UpdateBookingDto.prototype, "notes", void 0);
//# sourceMappingURL=update-booking.dto.js.map