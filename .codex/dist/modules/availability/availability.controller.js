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
exports.AvailabilityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const require_permission_decorator_1 = require("../auth/decorators/require-permission.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const availability_service_1 = require("./availability.service");
const get_day_bounds_dto_1 = require("./dto/get-day-bounds.dto");
const get_availability_dto_1 = require("./dto/get-availability.dto");
let AvailabilityController = class AvailabilityController {
    availabilityService;
    constructor(availabilityService) {
        this.availabilityService = availabilityService;
    }
    findAvailability(query, currentUser) {
        return this.availabilityService.findAvailabilityForBusiness(query, currentUser);
    }
    findDayBounds(query, currentUser) {
        return this.availabilityService.findDayBoundsForBusiness(query, currentUser);
    }
};
exports.AvailabilityController = AvailabilityController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar disponibilidad' }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan automaticamente su negocio.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'branchId', example: 2 }),
    (0, swagger_1.ApiQuery)({ name: 'serviceId', example: 3 }),
    (0, swagger_1.ApiQuery)({ name: 'date', example: '2026-08-20' }),
    (0, swagger_1.ApiQuery)({ name: 'resourceId', required: false, example: 5 }),
    (0, swagger_1.ApiQuery)({ name: 'resourceIsIndoor', required: false, example: false }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_availability_dto_1.GetAvailabilityDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "findAvailability", null);
__decorate([
    (0, common_1.Get)('day-bounds'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener horario minimo, maximo y bloqueos de un dia',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan automaticamente su negocio.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'branchId', example: 2 }),
    (0, swagger_1.ApiQuery)({ name: 'date', example: '2026-08-20' }),
    (0, swagger_1.ApiQuery)({ name: 'resourceId', required: false, example: 5 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_day_bounds_dto_1.GetDayBoundsDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "findDayBounds", null);
exports.AvailabilityController = AvailabilityController = __decorate([
    (0, swagger_1.ApiTags)('availability'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, require_permission_decorator_1.RequirePermission)('booking.manage'),
    (0, common_1.Controller)('availability'),
    __metadata("design:paramtypes", [availability_service_1.AvailabilityService])
], AvailabilityController);
//# sourceMappingURL=availability.controller.js.map