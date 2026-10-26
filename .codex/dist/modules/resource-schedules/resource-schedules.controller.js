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
exports.ResourceSchedulesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const require_permission_decorator_1 = require("../auth/decorators/require-permission.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const resource_schedules_service_1 = require("./resource-schedules.service");
const create_resource_schedule_dto_1 = require("./dto/create-resource-schedule.dto");
const update_resource_schedule_dto_1 = require("./dto/update-resource-schedule.dto");
let ResourceSchedulesController = class ResourceSchedulesController {
    resourceSchedulesService;
    constructor(resourceSchedulesService) {
        this.resourceSchedulesService = resourceSchedulesService;
    }
    create(createResourceScheduleDto, currentUser, businessId) {
        return this.resourceSchedulesService.createForBusiness(createResourceScheduleDto, currentUser, businessId);
    }
    findAll(currentUser, businessId) {
        return this.resourceSchedulesService.findAllForBusiness(currentUser, businessId);
    }
    findOne(id, currentUser, businessId) {
        return this.resourceSchedulesService.findOneForBusiness(+id, currentUser, businessId);
    }
    update(id, updateResourceScheduleDto, currentUser, businessId) {
        return this.resourceSchedulesService.updateForBusiness(+id, updateResourceScheduleDto, currentUser, businessId);
    }
    remove(id, currentUser, businessId) {
        return this.resourceSchedulesService.removeForBusiness(+id, currentUser, businessId);
    }
};
exports.ResourceSchedulesController = ResourceSchedulesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear horario de recurso' }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan automaticamente su negocio.',
    }),
    (0, swagger_1.ApiBody)({ type: create_resource_schedule_dto_1.CreateResourceScheduleDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_resource_schedule_dto_1.CreateResourceScheduleDto,
        user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], ResourceSchedulesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar horarios de recursos' }),
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
], ResourceSchedulesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener horario de recurso por id' }),
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
], ResourceSchedulesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar horario de recurso' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan automaticamente su negocio.',
    }),
    (0, swagger_1.ApiBody)({ type: update_resource_schedule_dto_1.UpdateResourceScheduleDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_resource_schedule_dto_1.UpdateResourceScheduleDto,
        user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], ResourceSchedulesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar horario de recurso' }),
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
], ResourceSchedulesController.prototype, "remove", null);
exports.ResourceSchedulesController = ResourceSchedulesController = __decorate([
    (0, swagger_1.ApiTags)('resource-schedules'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, require_permission_decorator_1.RequirePermission)('resource.manage'),
    (0, common_1.Controller)('resource-schedules'),
    __metadata("design:paramtypes", [resource_schedules_service_1.ResourceSchedulesService])
], ResourceSchedulesController);
//# sourceMappingURL=resource-schedules.controller.js.map