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
exports.RemindersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const require_permission_decorator_1 = require("../auth/decorators/require-permission.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const reminders_service_1 = require("./reminders.service");
const update_reminder_dto_1 = require("./dto/update-reminder.dto");
let RemindersController = class RemindersController {
    remindersService;
    constructor(remindersService) {
        this.remindersService = remindersService;
    }
    findAll(currentUser, businessId) {
        return this.remindersService.findAllForBusiness(currentUser, businessId);
    }
    findOne(id, currentUser, businessId) {
        return this.remindersService.findOneForBusiness(+id, currentUser, businessId);
    }
    update(id, updateReminderDto, currentUser, businessId) {
        return this.remindersService.updateForBusiness(+id, updateReminderDto, currentUser, businessId);
    }
    remove(id, currentUser, businessId) {
        return this.remindersService.removeForBusiness(+id, currentUser, businessId);
    }
};
exports.RemindersController = RemindersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Listar recordatorios',
        description: 'Devuelve solo recordatorios de reservas pertenecientes al negocio autorizado por el token.',
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
], RemindersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener recordatorio por id',
        description: 'Devuelve el recordatorio solo si pertenece al negocio autorizado por el token.',
    }),
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
], RemindersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Actualizar recordatorio',
        description: 'Actualiza el recordatorio solo si pertenece al negocio autorizado por el token.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 1 }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan automaticamente su negocio.',
    }),
    (0, swagger_1.ApiBody)({ type: update_reminder_dto_1.UpdateReminderDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_reminder_dto_1.UpdateReminderDto,
        user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], RemindersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Eliminar recordatorio',
        description: 'Elimina el recordatorio solo si pertenece al negocio autorizado por el token.',
    }),
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
], RemindersController.prototype, "remove", null);
exports.RemindersController = RemindersController = __decorate([
    (0, swagger_1.ApiTags)('reminders'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, require_permission_decorator_1.RequirePermission)('booking.manage'),
    (0, common_1.Controller)('reminders'),
    __metadata("design:paramtypes", [reminders_service_1.RemindersService])
], RemindersController);
//# sourceMappingURL=reminders.controller.js.map