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
exports.CreatePublicBookingDto = exports.CreatePublicBookingCustomerDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CreatePublicBookingCustomerDto {
    name;
    phone;
    email;
}
exports.CreatePublicBookingCustomerDto = CreatePublicBookingCustomerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Ignacio' }),
    __metadata("design:type", String)
], CreatePublicBookingCustomerDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+5493492123456' }),
    __metadata("design:type", String)
], CreatePublicBookingCustomerDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'ignacio@example.com' }),
    __metadata("design:type", Object)
], CreatePublicBookingCustomerDto.prototype, "email", void 0);
class CreatePublicBookingDto {
    serviceId;
    resourceId;
    startAt;
    resourceIsIndoor;
    customer;
    notes;
}
exports.CreatePublicBookingDto = CreatePublicBookingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], CreatePublicBookingDto.prototype, "serviceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 10 }),
    __metadata("design:type", Object)
], CreatePublicBookingDto.prototype, "resourceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-25T18:00:00-03:00' }),
    __metadata("design:type", String)
], CreatePublicBookingDto.prototype, "startAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: false,
        description: 'Preferencia opcional de recurso: true indoor/techado, false outdoor/aire libre.',
    }),
    __metadata("design:type", Object)
], CreatePublicBookingDto.prototype, "resourceIsIndoor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: CreatePublicBookingCustomerDto }),
    __metadata("design:type", CreatePublicBookingCustomerDto)
], CreatePublicBookingDto.prototype, "customer", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Reserva creada desde la web publica' }),
    __metadata("design:type", Object)
], CreatePublicBookingDto.prototype, "notes", void 0);
//# sourceMappingURL=create-public-booking.dto.js.map