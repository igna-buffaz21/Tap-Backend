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
exports.CreateProductDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CreateProductDto {
    category_id;
    name;
    description;
    sku;
    unit;
    cost_price;
    sale_price;
    branch_id;
    minimum_quantity;
    status;
}
exports.CreateProductDto = CreateProductDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 3,
        nullable: true,
        description: 'Categoria del producto. Se valida contra el negocio autorizado por el token.',
    }),
    __metadata("design:type", Object)
], CreateProductDto.prototype, "category_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Agua mineral 500ml' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Botella individual' }),
    __metadata("design:type", Object)
], CreateProductDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'AGUA-500' }),
    __metadata("design:type", Object)
], CreateProductDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['unit', 'kg', 'g', 'l', 'ml', 'box', 'pack'],
        default: 'unit',
        example: 'unit',
    }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 1200.5,
        nullable: true,
    }),
    __metadata("design:type", Object)
], CreateProductDto.prototype, "cost_price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 1800,
        nullable: true,
    }),
    __metadata("design:type", Object)
], CreateProductDto.prototype, "sale_price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 2,
        description: 'Sucursal donde se crea el stock inicial del producto. Se valida contra ' +
            'el negocio autorizado por el token.',
    }),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "branch_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 5,
        default: 0,
        description: 'Stock minimo inicial para la sucursal indicada en branch_id.',
    }),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "minimum_quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['active', 'inactive'],
        default: 'active',
        example: 'active',
    }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "status", void 0);
//# sourceMappingURL=create-product.dto.js.map