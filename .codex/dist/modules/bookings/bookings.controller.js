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
exports.BookingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const rxjs_1 = require("rxjs");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const require_permission_decorator_1 = require("../auth/decorators/require-permission.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const bookings_service_1 = require("./bookings.service");
const create_booking_dto_1 = require("./dto/create-booking.dto");
const create_fixed_bookings_dto_1 = require("./dto/create-fixed-bookings.dto");
const get_bookings_query_dto_1 = require("./dto/get-bookings-query.dto");
const update_booking_dto_1 = require("./dto/update-booking.dto");
let BookingsController = class BookingsController {
    bookingsService;
    constructor(bookingsService) {
        this.bookingsService = bookingsService;
    }
    create(createBookingDto, currentUser, businessId) {
        return this.bookingsService.createForBusiness(createBookingDto, currentUser, businessId);
    }
    createFixed(createFixedBookingsDto, currentUser, businessId) {
        return this.bookingsService.createFixedForBusiness(createFixedBookingsDto, currentUser, businessId);
    }
    findAll(query, currentUser) {
        return this.bookingsService.streamAllForBusiness(query, currentUser).pipe((0, rxjs_1.map)((payload) => ({
            type: payload.event,
            data: payload,
        })));
    }
    findOne(id, currentUser, businessId) {
        return this.bookingsService.findOneForBusiness(id, currentUser, businessId);
    }
    update(id, updateBookingDto, currentUser, businessId) {
        return this.bookingsService.updateForBusiness(id, updateBookingDto, currentUser, businessId);
    }
    reconfirm(id, currentUser, businessId) {
        return this.bookingsService.reconfirmForBusiness(id, currentUser, businessId);
    }
    cancelFromReminder(id, currentUser, businessId) {
        return this.bookingsService.cancelFromReminderForBusiness(id, currentUser, businessId);
    }
    remove(id, currentUser, businessId) {
        return this.bookingsService.removeForBusiness(+id, currentUser, businessId);
    }
};
exports.BookingsController = BookingsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear reserva' }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan el negocio del token.',
    }),
    (0, swagger_1.ApiBody)({ type: create_booking_dto_1.CreateBookingDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_booking_dto_1.CreateBookingDto,
        user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('fixed'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear turnos fijos semanales' }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan el negocio del token.',
    }),
    (0, swagger_1.ApiBody)({ type: create_fixed_bookings_dto_1.CreateFixedBookingsDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_fixed_bookings_dto_1.CreateFixedBookingsDto,
        user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "createFixed", null);
__decorate([
    (0, common_1.Sse)(),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar reservas en tiempo real con SSE' }),
    (0, swagger_1.ApiProduces)('text/event-stream'),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan el negocio del token.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'from', example: '2026-08-18' }),
    (0, swagger_1.ApiQuery)({ name: 'to', example: '2026-08-18' }),
    (0, swagger_1.ApiQuery)({ name: 'branchId', required: false, example: 2 }),
    (0, swagger_1.ApiQuery)({ name: 'resourceId', required: false, example: 5 }),
    (0, swagger_1.ApiQuery)({ name: 'serviceId', required: false, example: 3 }),
    (0, swagger_1.ApiQuery)({ name: 'customerId', required: false, example: 20 }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, example: 50 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_bookings_query_dto_1.GetBookingsQueryDto,
        user_entity_1.User]),
    __metadata("design:returntype", rxjs_1.Observable)
], BookingsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar reserva por id' }),
    (0, swagger_1.ApiParam)({ name: 'id', example: 150 }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan el negocio del token.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Actualizar reserva',
        description: 'Para finalizar un turno, enviar {"status":"COMPLETED"}. Tambien permite CANCELLED o NO_SHOW.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan el negocio del token.',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            example: {
                status: 'COMPLETED',
            },
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_booking_dto_1.UpdateBookingDto,
        user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/reconfirm'),
    (0, swagger_1.ApiOperation)({ summary: 'Reconfirmar reserva desde recordatorio' }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan el negocio del token.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "reconfirm", null);
__decorate([
    (0, common_1.Patch)(':id/cancel-from-reminder'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancelar reserva desde recordatorio' }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan el negocio del token.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "cancelFromReminder", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar reserva' }),
    (0, swagger_1.ApiQuery)({
        name: 'businessId',
        required: false,
        example: 1,
        description: 'Requerido para superadmin. Usuarios de negocio usan el negocio del token.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "remove", null);
exports.BookingsController = BookingsController = __decorate([
    (0, swagger_1.ApiTags)('bookings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, require_permission_decorator_1.RequirePermission)('booking.manage'),
    (0, common_1.Controller)('bookings'),
    __metadata("design:paramtypes", [bookings_service_1.BookingsService])
], BookingsController);
//# sourceMappingURL=bookings.controller.js.map