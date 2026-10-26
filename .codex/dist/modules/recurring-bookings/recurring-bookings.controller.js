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
exports.RecurringBookingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const require_permission_decorator_1 = require("../auth/decorators/require-permission.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const create_recurring_booking_dto_1 = require("./dto/create-recurring-booking.dto");
const update_recurring_booking_dto_1 = require("./dto/update-recurring-booking.dto");
const recurring_bookings_service_1 = require("./recurring-bookings.service");
let RecurringBookingsController = class RecurringBookingsController {
    recurringBookingsService;
    constructor(recurringBookingsService) {
        this.recurringBookingsService = recurringBookingsService;
    }
    create(createRecurringBookingDto, currentUser, businessId) {
        return this.recurringBookingsService.createForBusiness(createRecurringBookingDto, currentUser, businessId);
    }
    findAll(currentUser, businessId, search, page, limit) {
        return this.recurringBookingsService.findAllForBusiness(currentUser, businessId, search, page, limit);
    }
    findOne(id, currentUser, businessId) {
        return this.recurringBookingsService.findOneForBusiness(id, currentUser, businessId);
    }
    update(id, updateRecurringBookingDto, currentUser, businessId) {
        return this.recurringBookingsService.updateForBusiness(id, updateRecurringBookingDto, currentUser, businessId);
    }
    remove(id, currentUser, businessId) {
        return this.recurringBookingsService.removeForBusiness(id, currentUser, businessId);
    }
};
exports.RecurringBookingsController = RecurringBookingsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear reserva fija recurrente' }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan automaticamente su negocio.',
    }),
    (0, swagger_1.ApiBody)({ type: create_recurring_booking_dto_1.CreateRecurringBookingDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_recurring_booking_dto_1.CreateRecurringBookingDto,
        user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], RecurringBookingsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar reservas fijas recurrentes' }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan automaticamente su negocio.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'search',
        required: false,
        example: 'Juan',
        description: 'Busca por nombre, telefono o email del cliente.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, example: 20 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('businessId')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String, String, String, String]),
    __metadata("design:returntype", void 0)
], RecurringBookingsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener reserva fija recurrente por id' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 10 }),
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
], RecurringBookingsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar reserva fija recurrente' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 10 }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan automaticamente su negocio.',
    }),
    (0, swagger_1.ApiBody)({ type: update_recurring_booking_dto_1.UpdateRecurringBookingDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_recurring_booking_dto_1.UpdateRecurringBookingDto,
        user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], RecurringBookingsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar reserva fija recurrente' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 10 }),
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
], RecurringBookingsController.prototype, "remove", null);
exports.RecurringBookingsController = RecurringBookingsController = __decorate([
    (0, swagger_1.ApiTags)('recurring-bookings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, require_permission_decorator_1.RequirePermission)('booking.manage'),
    (0, common_1.Controller)('recurring-bookings'),
    __metadata("design:paramtypes", [recurring_bookings_service_1.RecurringBookingsService])
], RecurringBookingsController);
//# sourceMappingURL=recurring-bookings.controller.js.map