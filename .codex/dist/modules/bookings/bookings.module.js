"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsModule = void 0;
const common_1 = require("@nestjs/common");
const bookings_service_1 = require("./bookings.service");
const bookings_controller_1 = require("./bookings.controller");
const bookings_repository_1 = require("./bookings.repository");
const booking_rules_repository_1 = require("./booking-rules.repository");
const booking_rules_service_1 = require("./booking-rules.service");
const bookings_events_service_1 = require("./bookings-events.service");
const bookings_auto_completion_service_1 = require("./bookings-auto-completion.service");
const reminders_repository_1 = require("../reminders/reminders.repository");
const customers_module_1 = require("../customers/customers.module");
const recurring_bookings_module_1 = require("../recurring-bookings/recurring-bookings.module");
let BookingsModule = class BookingsModule {
};
exports.BookingsModule = BookingsModule;
exports.BookingsModule = BookingsModule = __decorate([
    (0, common_1.Module)({
        imports: [customers_module_1.CustomersModule, recurring_bookings_module_1.RecurringBookingsModule],
        controllers: [bookings_controller_1.BookingsController],
        providers: [
            bookings_service_1.BookingsService,
            bookings_repository_1.BookingsRepository,
            bookings_events_service_1.BookingsEventsService,
            bookings_auto_completion_service_1.BookingsAutoCompletionService,
            booking_rules_service_1.BookingRulesService,
            booking_rules_repository_1.BookingRulesRepository,
            reminders_repository_1.RemindersRepository,
        ],
        exports: [bookings_service_1.BookingsService, booking_rules_service_1.BookingRulesService],
    })
], BookingsModule);
//# sourceMappingURL=bookings.module.js.map