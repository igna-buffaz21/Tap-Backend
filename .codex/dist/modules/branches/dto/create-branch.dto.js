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
exports.CreateBranchDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CreateBranchDto {
    business_id;
    name;
    slug;
    description;
    logo_url;
    cover_image_url;
    instagram_url;
    facebook_url;
    address;
    phone;
    status;
}
exports.CreateBranchDto = CreateBranchDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], CreateBranchDto.prototype, "business_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Centro' }),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'centro' }),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Sucursal principal en Nueva Cordoba' }),
    __metadata("design:type", Object)
], CreateBranchDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://example.com/logo.png' }),
    __metadata("design:type", Object)
], CreateBranchDto.prototype, "logo_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://example.com/cover.png' }),
    __metadata("design:type", Object)
], CreateBranchDto.prototype, "cover_image_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://instagram.com/turnero' }),
    __metadata("design:type", Object)
], CreateBranchDto.prototype, "instagram_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://facebook.com/turnero' }),
    __metadata("design:type", Object)
], CreateBranchDto.prototype, "facebook_url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Av. Siempre Viva 123' }),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '3515555555' }),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'ACTIVE', default: 'ACTIVE' }),
    __metadata("design:type", String)
], CreateBranchDto.prototype, "status", void 0);
//# sourceMappingURL=create-branch.dto.js.map