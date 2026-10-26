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
exports.ResourceServicesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const require_permission_decorator_1 = require("../auth/decorators/require-permission.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const create_resource_service_dto_1 = require("./dto/create-resource-service.dto");
const resource_services_service_1 = require("./resource-services.service");
let ResourceServicesController = class ResourceServicesController {
    resourceServicesService;
    constructor(resourceServicesService) {
        this.resourceServicesService = resourceServicesService;
    }
    create(createResourceServiceDto, currentUser, businessId) {
        return this.resourceServicesService.createForBusiness(createResourceServiceDto, currentUser, businessId);
    }
    findAll(currentUser, businessId) {
        return this.resourceServicesService.findAllForBusiness(currentUser, businessId);
    }
    remove(resourceId, serviceId, currentUser, businessId) {
        return this.resourceServicesService.removeForBusiness(+resourceId, +serviceId, currentUser, businessId);
    }
};
exports.ResourceServicesController = ResourceServicesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Vincular recurso con servicio' }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan automaticamente su negocio.',
    }),
    (0, swagger_1.ApiBody)({ type: create_resource_service_dto_1.CreateResourceServiceDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_resource_service_dto_1.CreateResourceServiceDto,
        user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], ResourceServicesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar vinculos recurso-servicio' }),
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
], ResourceServicesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Delete)(':resourceId/:serviceId'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar vinculo recurso-servicio' }),
    (0, swagger_1.ApiParam)({ name: 'resourceId', example: 5 }),
    (0, swagger_1.ApiParam)({ name: 'serviceId', example: 3 }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan automaticamente su negocio.',
    }),
    __param(0, (0, common_1.Param)('resourceId')),
    __param(1, (0, common_1.Param)('serviceId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], ResourceServicesController.prototype, "remove", null);
exports.ResourceServicesController = ResourceServicesController = __decorate([
    (0, swagger_1.ApiTags)('resource-services'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, require_permission_decorator_1.RequirePermission)('resource.manage'),
    (0, common_1.Controller)('resource-services'),
    __metadata("design:paramtypes", [resource_services_service_1.ResourceServicesService])
], ResourceServicesController);
//# sourceMappingURL=resource-services.controller.js.map