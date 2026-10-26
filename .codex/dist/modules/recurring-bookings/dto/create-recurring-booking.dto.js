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
exports.CreateRecurringBookingDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CreateRecurringBookingDto {
    branch_id;
    resource_id;
    service_id;
    customer_id;
    day_of_week;
    start_time;
    start_date;
    end_date;
    status;
}
exports.CreateRecurringBookingDto = CreateRecurringBookingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2 }),
    __metadata("design:type", Number)
], CreateRecurringBookingDto.prototype, "branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5 }),
    __metadata("design:type", Number)
], CreateRecurringBookingDto.prototype, "resource_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], CreateRecurringBookingDto.prototype, "service_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 20 }),
    __metadata("design:type", Number)
], CreateRecurringBookingDto.prototype, "customer_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 4,
        description: '1 = lunes, 7 = domingo.',
    }),
    __metadata("design:type", Number)
], CreateRecurringBookingDto.prototype, "day_of_week", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '20:00:00' }),
    __metadata("design:type", String)
], CreateRecurringBookingDto.prototype, "start_time", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-20' }),
    __metadata("design:type", String)
], CreateRecurringBookingDto.prototype, "start_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-11-20' }),
    __metadata("design:type", String)
], CreateRecurringBookingDto.prototype, "end_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['ACTIVE', 'PAUSED', 'CANCELLED'] }),
    __metadata("design:type", String)
], CreateRecurringBookingDto.prototype, "status", void 0);
//# sourceMappingURL=create-recurring-booking.dto.js.map