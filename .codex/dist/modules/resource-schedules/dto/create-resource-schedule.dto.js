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
exports.CreateResourceScheduleDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CreateResourceScheduleDto {
    resource_id;
    day_of_week;
    start_time;
    end_time;
    status;
}
exports.CreateResourceScheduleDto = CreateResourceScheduleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5 }),
    __metadata("design:type", Number)
], CreateResourceScheduleDto.prototype, "resource_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 4,
        description: 'Dia de la semana: 0 domingo, 1 lunes, ... 6 sabado',
    }),
    __metadata("design:type", Number)
], CreateResourceScheduleDto.prototype, "day_of_week", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '08:00' }),
    __metadata("design:type", String)
], CreateResourceScheduleDto.prototype, "start_time", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '22:00' }),
    __metadata("design:type", String)
], CreateResourceScheduleDto.prototype, "end_time", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'ACTIVE', default: 'ACTIVE' }),
    __metadata("design:type", String)
], CreateResourceScheduleDto.prototype, "status", void 0);
//# sourceMappingURL=create-resource-schedule.dto.js.map