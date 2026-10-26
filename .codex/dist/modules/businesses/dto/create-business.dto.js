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
exports.CreateBusinessDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CreateBusinessDto {
    name;
    slug;
    business_type;
    timezone;
    currency;
    status;
}
exports.CreateBusinessDto = CreateBusinessDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Club Centro' }),
    __metadata("design:type", String)
], CreateBusinessDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'club-centro' }),
    __metadata("design:type", String)
], CreateBusinessDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SPORTS' }),
    __metadata("design:type", String)
], CreateBusinessDto.prototype, "business_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'America/Argentina/Cordoba' }),
    __metadata("design:type", String)
], CreateBusinessDto.prototype, "timezone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ARS' }),
    __metadata("design:type", String)
], CreateBusinessDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'ACTIVE', default: 'ACTIVE' }),
    __metadata("design:type", String)
], CreateBusinessDto.prototype, "status", void 0);
//# sourceMappingURL=create-business.dto.js.map