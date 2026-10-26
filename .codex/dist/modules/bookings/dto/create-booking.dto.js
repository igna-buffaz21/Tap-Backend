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
exports.CreateBookingDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CreateBookingDto {
    businessId;
    branchId;
    resourceId;
    serviceId;
    customerId;
    customerPhone;
    startAt;
    source;
    resourceIsIndoor;
    reservationName;
    notes;
}
exports.CreateBookingDto = CreateBookingDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 1,
        description: 'No requerido en endpoints autenticados: se resuelve desde el token. Superadmin usa businessId por query.',
    }),
    __metadata("design:type", Number)
], CreateBookingDto.prototype, "businessId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2 }),
    __metadata("design:type", Number)
], CreateBookingDto.prototype, "branchId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 5,
        description: 'Opcional para servicios AUTO/OPTIONAL. Requerido para servicios REQUIRED.',
    }),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "resourceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], CreateBookingDto.prototype, "serviceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 20,
        nullable: true,
        description: 'Puede omitirse cuando source es ADMIN si se envia customerPhone.',
    }),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "customerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '3514112233',
        description: 'Requerido cuando source es ADMIN y no se envia customerId. Usa reservationName como nombre del cliente.',
    }),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "customerPhone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-20T20:00:00-03:00' }),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "startAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['WEB', 'WHATSAPP', 'ADMIN'], example: 'WEB' }),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: false,
        description: 'Preferencia de recurso: true indoor/techado, false outdoor/aire libre.',
    }),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "resourceIsIndoor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Ignacio Buffaz' }),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "reservationName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Reserva creada desde Swagger' }),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "notes", void 0);
//# sourceMappingURL=create-booking.dto.js.map