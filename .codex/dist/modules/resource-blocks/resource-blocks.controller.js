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
exports.ResourceBlocksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const require_permission_decorator_1 = require("../auth/decorators/require-permission.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const resource_blocks_service_1 = require("./resource-blocks.service");
const create_resource_block_dto_1 = require("./dto/create-resource-block.dto");
const update_resource_block_dto_1 = require("./dto/update-resource-block.dto");
let ResourceBlocksController = class ResourceBlocksController {
    resourceBlocksService;
    constructor(resourceBlocksService) {
        this.resourceBlocksService = resourceBlocksService;
    }
    create(createResourceBlockDto, currentUser, businessId) {
        return this.resourceBlocksService.createForBusiness(createResourceBlockDto, currentUser, businessId);
    }
    findAll(currentUser, businessId) {
        return this.resourceBlocksService.findAllForBusiness(currentUser, businessId);
    }
    findOne(id, currentUser, businessId) {
        return this.resourceBlocksService.findOneForBusiness(+id, currentUser, businessId);
    }
    update(id, updateResourceBlockDto, currentUser, businessId) {
        return this.resourceBlocksService.updateForBusiness(+id, updateResourceBlockDto, currentUser, businessId);
    }
    remove(id, currentUser, businessId) {
        return this.resourceBlocksService.removeForBusiness(+id, currentUser, businessId);
    }
};
exports.ResourceBlocksController = ResourceBlocksController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear bloqueo de recurso' }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan automaticamente su negocio.',
    }),
    (0, swagger_1.ApiBody)({ type: create_resource_block_dto_1.CreateResourceBlockDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_resource_block_dto_1.CreateResourceBlockDto,
        user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], ResourceBlocksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar bloqueos de recursos' }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan automaticamente su negocio.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], ResourceBlocksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener bloqueo de recurso por id' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan automaticamente su negocio.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], ResourceBlocksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar bloqueo de recurso' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan automaticamente su negocio.',
    }),
    (0, swagger_1.ApiBody)({ type: update_resource_block_dto_1.UpdateResourceBlockDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_resource_block_dto_1.UpdateResourceBlockDto,
        user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], ResourceBlocksController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar bloqueo de recurso' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan automaticamente su negocio.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], ResourceBlocksController.prototype, "remove", null);
exports.ResourceBlocksController = ResourceBlocksController = __decorate([
    (0, swagger_1.ApiTags)('resource-blocks'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, require_permission_decorator_1.RequirePermission)('resource.manage'),
    (0, common_1.Controller)('resource-blocks'),
    __metadata("design:paramtypes", [resource_blocks_service_1.ResourceBlocksService])
], ResourceBlocksController);
//# sourceMappingURL=resource-blocks.controller.js.map