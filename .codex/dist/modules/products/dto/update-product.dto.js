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
exports.UpdateProductDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class UpdateProductDto {
    category_id;
    name;
    description;
    sku;
    unit;
    cost_price;
    sale_price;
}
exports.UpdateProductDto = UpdateProductDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 3,
        nullable: true,
        description: 'Nueva categoria del producto. Se valida contra el negocio autorizado por el token.',
    }),
    __metadata("design:type", Object)
], UpdateProductDto.prototype, "category_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Agua mineral 500ml' }),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Botella individual' }),
    __metadata("design:type", Object)
], UpdateProductDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'AGUA-500' }),
    __metadata("design:type", Object)
], UpdateProductDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['unit', 'kg', 'g', 'l', 'ml', 'box', 'pack'],
        example: 'unit',
    }),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 1200.5,
        nullable: true,
    }),
    __metadata("design:type", Object)
], UpdateProductDto.prototype, "cost_price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 1800,
        nullable: true,
    }),
    __metadata("design:type", Object)
], UpdateProductDto.prototype, "sale_price", void 0);
//# sourceMappingURL=update-product.dto.js.map