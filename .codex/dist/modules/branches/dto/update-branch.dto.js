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
exports.UpdateBranchDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const OPENING_HOURS_EXAMPLE = {
    monday: [{ open: '08:00', close: '22:00' }],
    tuesday: [{ open: '08:00', close: '22:00' }],
    wednesday: [{ open: '08:00', close: '22:00' }],
    thursday: [{ open: '08:00', close: '22:00' }],
    friday: [{ open: '08:00', close: '22:00' }],
    saturday: [],
    sunday: [],
};
class UpdateBranchDto {
    name;
    slug;
    description;
    logo_url;
    cover_image_url;
    primary_color;
    instagram_url;
    facebook_url;
    address;
    phone;
    lat;
    lng;
    opening_hours;
}
exports.UpdateBranchDto = UpdateBranchDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Centro' }),
    __metadata("design:type", String)
], UpdateBranchDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'centro' }),
    __metadata("design:type", String)
], UpdateBranchDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Sucursal principal en Nueva Cordoba' }),
    __metadata("design:type", Object)
], UpdateBranchDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://example.com/logo.png' }),
    __metadata("design:type", Object)
], UpdateBranchDto.prototype, "logo_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://example.com/cover.png' }),
    __metadata("design:type", Object)
], UpdateBranchDto.prototype, "cover_image_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '#0F766E' }),
    __metadata("design:type", Object)
], UpdateBranchDto.prototype, "primary_color", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://instagram.com/turnero' }),
    __metadata("design:type", Object)
], UpdateBranchDto.prototype, "instagram_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://facebook.com/turnero' }),
    __metadata("design:type", Object)
], UpdateBranchDto.prototype, "facebook_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Av. Siempre Viva 123' }),
    __metadata("design:type", String)
], UpdateBranchDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '3515555555' }),
    __metadata("design:type", String)
], UpdateBranchDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: -31.420083, nullable: true }),
    __metadata("design:type", Object)
], UpdateBranchDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: -64.188776, nullable: true }),
    __metadata("design:type", Object)
], UpdateBranchDto.prototype, "lng", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: OPENING_HOURS_EXAMPLE,
        nullable: true,
        type: Object,
    }),
    __metadata("design:type", Object)
], UpdateBranchDto.prototype, "opening_hours", void 0);
//# sourceMappingURL=update-branch.dto.js.map