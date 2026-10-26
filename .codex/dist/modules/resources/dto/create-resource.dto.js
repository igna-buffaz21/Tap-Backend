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
exports.CreateResourceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CreateResourceDto {
    branch_id;
    name;
    type;
    capacity;
    photo_url;
    status;
    is_indoor;
    priority;
}
exports.CreateResourceDto = CreateResourceDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 2,
        description: 'Sucursal donde se crea el recurso. Se valida contra el negocio autorizado por el token.',
    }),
    __metadata("design:type", Number)
], CreateResourceDto.prototype, "branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Cancha 1' }),
    __metadata("design:type", String)
], CreateResourceDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'COURT' }),
    __metadata("design:type", String)
], CreateResourceDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], CreateResourceDto.prototype, "capacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://example.com/cancha-1.jpg' }),
    __metadata("design:type", Object)
], CreateResourceDto.prototype, "photo_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'ACTIVE', default: 'ACTIVE' }),
    __metadata("design:type", String)
], CreateResourceDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: true,
        nullable: true,
        description: 'true indoor/techado, false outdoor/aire libre, null no aplica',
    }),
    __metadata("design:type", Object)
], CreateResourceDto.prototype, "is_indoor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1, default: 1 }),
    __metadata("design:type", Number)
], CreateResourceDto.prototype, "priority", void 0);
//# sourceMappingURL=create-resource.dto.js.map