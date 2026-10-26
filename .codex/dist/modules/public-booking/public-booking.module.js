"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicBookingModule = void 0;
const common_1 = require("@nestjs/common");
const availability_module_1 = require("../availability/availability.module");
const bookings_module_1 = require("../bookings/bookings.module");
const customers_module_1 = require("../customers/customers.module");
const public_booking_controller_1 = require("./public-booking.controller");
const public_booking_repository_1 = require("./public-booking.repository");
const public_booking_service_1 = require("./public-booking.service");
let PublicBookingModule = class PublicBookingModule {
};
exports.PublicBookingModule = PublicBookingModule;
exports.PublicBookingModule = PublicBookingModule = __decorate([
    (0, common_1.Module)({
        imports: [availability_module_1.AvailabilityModule, bookings_module_1.BookingsModule, customers_module_1.CustomersModule],
        controllers: [public_booking_controller_1.PublicBookingController],
        providers: [public_booking_service_1.PublicBookingService, public_booking_repository_1.PublicBookingRepository],
    })
], PublicBookingModule);
//# sourceMappingURL=public-booking.module.js.map