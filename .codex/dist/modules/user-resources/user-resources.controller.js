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
exports.UserResourcesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const require_permission_decorator_1 = require("../auth/decorators/require-permission.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const assign_user_resource_dto_1 = require("./dto/assign-user-resource.dto");
const user_resources_service_1 = require("./user-resources.service");
let UserResourcesController = class UserResourcesController {
    userResourcesService;
    constructor(userResourcesService) {
        this.userResourcesService = userResourcesService;
    }
    findAll(userId, currentUser) {
        return this.userResourcesService.findAllForUser(+userId, currentUser);
    }
    assign(userId, assignUserResourceDto, currentUser) {
        return this.userResourcesService.assignResourceToUser(+userId, assignUserResourceDto, currentUser);
    }
    remove(userId, resourceId, currentUser) {
        return this.userResourcesService.removeResourceFromUser(+userId, +resourceId, currentUser);
    }
};
exports.UserResourcesController = UserResourcesController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequireAnyPermission)('user.read', 'user.manage', 'resource.manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar recursos asignados a un usuario' }),
    (0, swagger_1.ApiParam)({ name: 'userId', example: 1 }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", void 0)
], UserResourcesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequireAnyPermission)('user.manage', 'resource.manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Asignar recurso a un usuario' }),
    (0, swagger_1.ApiParam)({ name: 'userId', example: 1 }),
    (0, swagger_1.ApiBody)({ type: assign_user_resource_dto_1.AssignUserResourceDto }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_user_resource_dto_1.AssignUserResourceDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], UserResourcesController.prototype, "assign", null);
__decorate([
    (0, common_1.Delete)(':resourceId'),
    (0, require_permission_decorator_1.RequireAnyPermission)('user.manage', 'resource.manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Quitar recurso asignado a un usuario' }),
    (0, swagger_1.ApiParam)({ name: 'userId', example: 1 }),
    (0, swagger_1.ApiParam)({ name: 'resourceId', example: 12 }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('resourceId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, user_entity_1.User]),
    __metadata("design:returntype", void 0)
], UserResourcesController.prototype, "remove", null);
exports.UserResourcesController = UserResourcesController = __decorate([
    (0, swagger_1.ApiTags)('user-resources'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('users/:userId/resources'),
    __metadata("design:paramtypes", [user_resources_service_1.UserResourcesService])
], UserResourcesController);
//# sourceMappingURL=user-resources.controller.js.map