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
exports.CreateFixedBookingsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CreateFixedBookingsDto {
    businessId;
    branchId;
    resourceId;
    serviceId;
    customerId;
    customerPhone;
    startAt;
    periodMonths;
    reservationName;
    source;
    resourceIsIndoor;
}
exports.CreateFixedBookingsDto = CreateFixedBookingsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 1,
        description: 'No requerido en endpoints autenticados: se resuelve desde el token. Superadmin usa businessId por query.',
    }),
    __metadata("design:type", Number)
], CreateFixedBookingsDto.prototype, "businessId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2 }),
    __metadata("design:type", Number)
], CreateFixedBookingsDto.prototype, "branchId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 5,
        description: 'Opcional para servicios AUTO/OPTIONAL. Requerido para servicios REQUIRED.',
    }),
    __metadata("design:type", Object)
], CreateFixedBookingsDto.prototype, "resourceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], CreateFixedBookingsDto.prototype, "serviceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 20,
        nullable: true,
        description: 'Puede omitirse cuando source es ADMIN si se envia customerPhone.',
    }),
    __metadata("design:type", Object)
], CreateFixedBookingsDto.prototype, "customerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '3514112233',
        description: 'Requerido cuando source es ADMIN y no se envia customerId. Usa reservationName como nombre del cliente.',
    }),
    __metadata("design:type", String)
], CreateFixedBookingsDto.prototype, "customerPhone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-20T20:00:00-03:00' }),
    __metadata("design:type", String)
], CreateFixedBookingsDto.prototype, "startAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: [3, 6, 12],
        example: 3,
        description: 'Periodo en meses para generar turnos semanales.',
    }),
    __metadata("design:type", Number)
], CreateFixedBookingsDto.prototype, "periodMonths", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Reserva fija Ignacio' }),
    __metadata("design:type", String)
], CreateFixedBookingsDto.prototype, "reservationName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['WEB', 'WHATSAPP', 'ADMIN'], example: 'ADMIN' }),
    __metadata("design:type", String)
], CreateFixedBookingsDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: false,
        description: 'Preferencia de recurso: true indoor/techado, false outdoor/aire libre.',
    }),
    __metadata("design:type", Object)
], CreateFixedBookingsDto.prototype, "resourceIsIndoor", void 0);
//# sourceMappingURL=create-fixed-bookings.dto.js.map