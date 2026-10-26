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
exports.AuthMeDto = exports.AuthMeRoleDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AuthMeRoleDto {
    id;
    name;
    status;
}
exports.AuthMeRoleDto = AuthMeRoleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], AuthMeRoleDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Administrador' }),
    __metadata("design:type", String)
], AuthMeRoleDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'active', enum: ['active', 'inactive'] }),
    __metadata("design:type", String)
], AuthMeRoleDto.prototype, "status", void 0);
class AuthMeDto {
    id;
    clerkId;
    name;
    email;
    photoUrl;
    status;
    business_id;
    branch_id;
    roles;
    permissions;
}
exports.AuthMeDto = AuthMeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], AuthMeDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user_xxx' }),
    __metadata("design:type", String)
], AuthMeDto.prototype, "clerkId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Nombre' }),
    __metadata("design:type", String)
], AuthMeDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'mail@test.com' }),
    __metadata("design:type", String)
], AuthMeDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '' }),
    __metadata("design:type", String)
], AuthMeDto.prototype, "photoUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'active', enum: ['active', 'inactive'] }),
    __metadata("design:type", String)
], AuthMeDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: null, nullable: true }),
    __metadata("design:type", Object)
], AuthMeDto.prototype, "business_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: null, nullable: true }),
    __metadata("design:type", Object)
], AuthMeDto.prototype, "branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [AuthMeRoleDto] }),
    __metadata("design:type", Array)
], AuthMeDto.prototype, "roles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: 'object',
        additionalProperties: {
            type: 'string',
            enum: ['own', 'branch', 'business'],
        },
        example: {
            'booking.manage': 'own',
            'customer.manage': 'branch',
            'resource.manage': 'branch',
            'stock.manage': 'branch',
            'analytics.view': 'own',
            'role.read': 'business',
        },
    }),
    __metadata("design:type", Object)
], AuthMeDto.prototype, "permissions", void 0);
//# sourceMappingURL=auth-me.dto.js.map