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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRolesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const require_permission_decorator_1 = require("../auth/decorators/require-permission.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const assign_user_role_dto_1 = require("./dto/assign-user-role.dto");
const user_roles_service_1 = require("./user-roles.service");
let UserRolesController = class UserRolesController {
    userRolesService;
    constructor(userRolesService) {
        this.userRolesService = userRolesService;
    }
    findAll(userId, currentUser) {
        return this.userRolesService.findAllForUser(+userId, currentUser);
    }
    assign(userId, assignUserRoleDto, currentUser) {
        return this.userRolesService.assignRoleToUser(+userId, assignUserRoleDto, currentUser);
    }
    remove(userId, roleId, currentUser) {
        return this.userRolesService.removeRoleFromUser(+userId, +roleId, currentUser);
    }
};
exports.UserRolesController = UserRolesController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequireAnyPermission)('user.read', 'user.manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar roles asignados a un usuario' }),
    (0, swagger_1.ApiParam)({ name: 'userId', example: 1 }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", void 0)
], UserRolesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Asignar rol a un usuario' }),
    (0, swagger_1.ApiParam)({ name: 'userId', example: 1 }),
    (0, swagger_1.ApiBody)({ type: assign_user_role_dto_1.AssignUserRoleDto }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_user_role_dto_1.AssignUserRoleDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], UserRolesController.prototype, "assign", null);
__decorate([
    (0, common_1.Delete)(':roleId'),
    (0, swagger_1.ApiOperation)({ summary: 'Quitar rol a un usuario' }),
    (0, swagger_1.ApiParam)({ name: 'userId', example: 1 }),
    (0, swagger_1.ApiParam)({ name: 'roleId', example: 1 }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('roleId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, user_entity_1.User]),
    __metadata("design:returntype", void 0)
], UserRolesController.prototype, "remove", null);
exports.UserRolesController = UserRolesController = __decorate([
    (0, swagger_1.ApiTags)('user-roles'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, require_permission_decorator_1.RequirePermission)('user.manage'),
    (0, common_1.Controller)('users/:userId/roles'),
    __metadata("design:paramtypes", [user_roles_service_1.UserRolesService])
], UserRolesController);
//# sourceMappingURL=user-roles.controller.js.map