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
exports.ResourcesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const require_permission_decorator_1 = require("../auth/decorators/require-permission.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const resources_service_1 = require("./resources.service");
const create_resource_dto_1 = require("./dto/create-resource.dto");
const update_resource_dto_1 = require("./dto/update-resource.dto");
let ResourcesController = class ResourcesController {
    resourcesService;
    constructor(resourcesService) {
        this.resourcesService = resourcesService;
    }
    create(createResourceDto, currentUser, businessId) {
        return this.resourcesService.createForBusiness(createResourceDto, currentUser, businessId);
    }
    findAll(currentUser, businessId) {
        return this.resourcesService.findAllForBusiness(currentUser, businessId);
    }
    findOne(id, currentUser, businessId) {
        return this.resourcesService.findOneForBusiness(+id, currentUser, businessId);
    }
    update(id, updateResourceDto, currentUser, businessId) {
        return this.resourcesService.updateForBusiness(+id, updateResourceDto, currentUser, businessId);
    }
};
exports.ResourcesController = ResourcesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Crear recurso',
        description: 'Usuarios de negocio usan automaticamente el negocio del token. Superadmin debe enviar businessId por query para validar la sucursal.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan automaticamente su negocio.',
    }),
    (0, swagger_1.ApiBody)({ type: create_resource_dto_1.CreateResourceDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_resource_dto_1.CreateResourceDto,
        user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], ResourcesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Listar recursos',
        description: 'Devuelve solo recursos de branches pertenecientes al negocio autorizado por el token.',
    }),
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
], ResourcesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener recurso por id',
        description: 'Devuelve el recurso solo si pertenece al negocio autorizado por el token.',
    }),
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
], ResourcesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Actualizar recurso',
        description: 'Solo permite actualizar recursos cuyo branch pertenece al negocio autorizado por el token.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan automaticamente su negocio.',
    }),
    (0, swagger_1.ApiBody)({ type: update_resource_dto_1.UpdateResourceDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_resource_dto_1.UpdateResourceDto,
        user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], ResourcesController.prototype, "update", null);
exports.ResourcesController = ResourcesController = __decorate([
    (0, swagger_1.ApiTags)('resources'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, require_permission_decorator_1.RequirePermission)('resource.manage'),
    (0, common_1.Controller)('resources'),
    __metadata("design:paramtypes", [resources_service_1.ResourcesService])
], ResourcesController);
//# sourceMappingURL=resources.controller.js.map