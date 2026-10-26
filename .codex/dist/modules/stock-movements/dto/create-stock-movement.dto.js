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
exports.CreateStockMovementDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CreateStockMovementDto {
    branch_id;
    product_id;
    type;
    quantity;
    unit_cost;
    reason;
    notes;
}
exports.CreateStockMovementDto = CreateStockMovementDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 2,
        description: 'Sucursal del movimiento. Se valida contra el negocio autorizado por el token.',
    }),
    __metadata("design:type", Number)
], CreateStockMovementDto.prototype, "branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 12,
        description: 'Producto del movimiento. Se valida contra el negocio autorizado por el token.',
    }),
    __metadata("design:type", Number)
], CreateStockMovementDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ['IN', 'OUT', 'ADJUSTMENT'],
        example: 'IN',
    }),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 3,
        description: 'Cantidad a sumar/restar. Para ADJUSTMENT representa el stock final contado.',
    }),
    __metadata("design:type", Number)
], CreateStockMovementDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 1250.5,
        description: 'Costo unitario registrado para este movimiento.',
    }),
    __metadata("design:type", Object)
], CreateStockMovementDto.prototype, "unit_cost", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: [
            'PURCHASE',
            'SALE',
            'INTERNAL_USE',
            'LOSS',
            'DAMAGE',
            'RETURN',
            'MANUAL_ADJUSTMENT',
            'OTHER',
        ],
        example: 'PURCHASE',
    }),
    __metadata("design:type", Object)
], CreateStockMovementDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Compra semanal' }),
    __metadata("design:type", Object)
], CreateStockMovementDto.prototype, "notes", void 0);
//# sourceMappingURL=create-stock-movement.dto.js.map