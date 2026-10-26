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
exports.CreateResourceBlockDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CreateResourceBlockDto {
    resource_id;
    start_at;
    end_at;
    reason;
}
exports.CreateResourceBlockDto = CreateResourceBlockDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5 }),
    __metadata("design:type", Number)
], CreateResourceBlockDto.prototype, "resource_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-20T12:00:00-03:00' }),
    __metadata("design:type", String)
], CreateResourceBlockDto.prototype, "start_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-20T13:00:00-03:00' }),
    __metadata("design:type", String)
], CreateResourceBlockDto.prototype, "end_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Mantenimiento' }),
    __metadata("design:type", String)
], CreateResourceBlockDto.prototype, "reason", void 0);
//# sourceMappingURL=create-resource-block.dto.js.map