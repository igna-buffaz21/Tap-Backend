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
exports.PublicBookingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const cancel_public_booking_by_phone_dto_1 = require("./dto/cancel-public-booking-by-phone.dto");
const cancel_public_booking_dto_1 = require("./dto/cancel-public-booking.dto");
const create_public_booking_dto_1 = require("./dto/create-public-booking.dto");
const get_public_availability_dto_1 = require("./dto/get-public-availability.dto");
const get_public_bookings_by_phone_query_dto_1 = require("./dto/get-public-bookings-by-phone-query.dto");
const get_public_bookings_query_dto_1 = require("./dto/get-public-bookings-query.dto");
const public_booking_service_1 = require("./public-booking.service");
let PublicBookingController = class PublicBookingController {
    publicBookingService;
    constructor(publicBookingService) {
        this.publicBookingService = publicBookingService;
    }
    findBranch(slug) {
        return this.publicBookingService.findBranch(slug);
    }
    findServices(slug) {
        return this.publicBookingService.findServices(slug);
    }
    findServiceResources(slug, serviceId) {
        return this.publicBookingService.findServiceResources(slug, serviceId);
    }
    findAvailability(slug, query) {
        return this.publicBookingService.findAvailability(slug, query);
    }
    findBookings(slug, query) {
        return this.publicBookingService.findBookings(slug, query);
    }
    findBookingsByPhone(slug, query) {
        return this.publicBookingService.findBookingsByPhone(slug, query);
    }
    cancelBooking(slug, bookingId, dto) {
        return this.publicBookingService.cancelBooking(slug, bookingId, dto);
    }
    cancelBookingByPhone(slug, bookingId, dto) {
        return this.publicBookingService.cancelBookingByPhone(slug, bookingId, dto);
    }
    createBooking(slug, createPublicBookingDto) {
        return this.publicBookingService.createBooking(slug, createPublicBookingDto);
    }
};
exports.PublicBookingController = PublicBookingController;
__decorate([
    (0, common_1.Get)(':slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener datos publicos de una sede por slug' }),
    (0, swagger_1.ApiParam)({ name: 'slug', example: 'club-atletico-centro' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PublicBookingController.prototype, "findBranch", null);
__decorate([
    (0, common_1.Get)(':slug/services'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener servicios reservables de una sede publica',
    }),
    (0, swagger_1.ApiParam)({ name: 'slug', example: 'club-atletico-centro' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PublicBookingController.prototype, "findServices", null);
__decorate([
    (0, common_1.Get)(':slug/services/:serviceId/resources'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener recursos activos asociados a un servicio de la sede',
    }),
    (0, swagger_1.ApiParam)({ name: 'slug', example: 'club-atletico-centro' }),
    (0, swagger_1.ApiParam)({ name: 'serviceId', example: 1 }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('serviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PublicBookingController.prototype, "findServiceResources", null);
__decorate([
    (0, common_1.Get)(':slug/availability'),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar disponibilidad publica de una sede' }),
    (0, swagger_1.ApiParam)({ name: 'slug', example: 'club-atletico-centro' }),
    (0, swagger_1.ApiQuery)({ name: 'serviceId', example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'date', example: '2026-08-25' }),
    (0, swagger_1.ApiQuery)({ name: 'resourceId', required: false, example: 10 }),
    (0, swagger_1.ApiQuery)({ name: 'resourceIsIndoor', required: false, example: false }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, get_public_availability_dto_1.GetPublicAvailabilityDto]),
    __metadata("design:returntype", void 0)
], PublicBookingController.prototype, "findAvailability", null);
__decorate([
    (0, common_1.Get)(':slug/bookings'),
    (0, swagger_1.ApiOperation)({
        summary: 'Buscar reservas publicas futuras de una sede por email',
    }),
    (0, swagger_1.ApiParam)({ name: 'slug', example: 'club-atletico-centro' }),
    (0, swagger_1.ApiQuery)({ name: 'email', example: 'ignacio@example.com' }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, get_public_bookings_query_dto_1.GetPublicBookingsQueryDto]),
    __metadata("design:returntype", void 0)
], PublicBookingController.prototype, "findBookings", null);
__decorate([
    (0, common_1.Get)(':slug/bookings/by-phone'),
    (0, swagger_1.ApiOperation)({
        summary: 'Buscar reservas publicas futuras de una sede por telefono',
    }),
    (0, swagger_1.ApiParam)({ name: 'slug', example: 'club-atletico-centro' }),
    (0, swagger_1.ApiQuery)({ name: 'phone', example: '+5493534133580' }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, get_public_bookings_by_phone_query_dto_1.GetPublicBookingsByPhoneQueryDto]),
    __metadata("design:returntype", void 0)
], PublicBookingController.prototype, "findBookingsByPhone", null);
__decorate([
    (0, common_1.Patch)(':slug/bookings/:bookingId/cancel'),
    (0, swagger_1.ApiOperation)({
        summary: 'Cancelar una reserva publica activa por email',
    }),
    (0, swagger_1.ApiParam)({ name: 'slug', example: 'club-atletico-centro' }),
    (0, swagger_1.ApiParam)({ name: 'bookingId', example: 15 }),
    (0, swagger_1.ApiBody)({ type: cancel_public_booking_dto_1.CancelPublicBookingDto }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('bookingId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, cancel_public_booking_dto_1.CancelPublicBookingDto]),
    __metadata("design:returntype", void 0)
], PublicBookingController.prototype, "cancelBooking", null);
__decorate([
    (0, common_1.Patch)(':slug/bookings/:bookingId/cancel/by-phone'),
    (0, swagger_1.ApiOperation)({
        summary: 'Cancelar una reserva publica activa por telefono',
    }),
    (0, swagger_1.ApiParam)({ name: 'slug', example: 'club-atletico-centro' }),
    (0, swagger_1.ApiParam)({ name: 'bookingId', example: 15 }),
    (0, swagger_1.ApiBody)({ type: cancel_public_booking_by_phone_dto_1.CancelPublicBookingByPhoneDto }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('bookingId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, cancel_public_booking_by_phone_dto_1.CancelPublicBookingByPhoneDto]),
    __metadata("design:returntype", void 0)
], PublicBookingController.prototype, "cancelBookingByPhone", null);
__decorate([
    (0, common_1.Post)(':slug/bookings'),
    (0, swagger_1.ApiOperation)({ summary: 'Crear reserva publica para una sede' }),
    (0, swagger_1.ApiParam)({ name: 'slug', example: 'club-atletico-centro' }),
    (0, swagger_1.ApiBody)({ type: create_public_booking_dto_1.CreatePublicBookingDto }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_public_booking_dto_1.CreatePublicBookingDto]),
    __metadata("design:returntype", void 0)
], PublicBookingController.prototype, "createBooking", null);
exports.PublicBookingController = PublicBookingController = __decorate([
    (0, swagger_1.ApiTags)('public-booking'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Controller)('public/branches'),
    __metadata("design:paramtypes", [public_booking_service_1.PublicBookingService])
], PublicBookingController);
//# sourceMappingURL=public-booking.controller.js.map