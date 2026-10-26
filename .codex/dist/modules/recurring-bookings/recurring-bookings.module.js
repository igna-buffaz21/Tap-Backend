"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurringBookingsModule = void 0;
const common_1 = require("@nestjs/common");
const recurring_bookings_controller_1 = require("./recurring-bookings.controller");
const recurring_bookings_repository_1 = require("./recurring-bookings.repository");
const recurring_bookings_service_1 = require("./recurring-bookings.service");
let RecurringBookingsModule = class RecurringBookingsModule {
};
exports.RecurringBookingsModule = RecurringBookingsModule;
exports.RecurringBookingsModule = RecurringBookingsModule = __decorate([
    (0, common_1.Module)({
        controllers: [recurring_bookings_controller_1.RecurringBookingsController],
        providers: [recurring_bookings_service_1.RecurringBookingsService, recurring_bookings_repository_1.RecurringBookingsRepository],
        exports: [recurring_bookings_service_1.RecurringBookingsService, recurring_bookings_repository_1.RecurringBookingsRepository],
    })
], RecurringBookingsModule);
//# sourceMappingURL=recurring-bookings.module.js.map