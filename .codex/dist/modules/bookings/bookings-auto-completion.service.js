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
var BookingsAutoCompletionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsAutoCompletionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bookings_events_service_1 = require("./bookings-events.service");
const bookings_repository_1 = require("./bookings.repository");
const DEFAULT_AUTO_COMPLETION_INTERVAL_MS = 10 * 60 * 1000;
const DEFAULT_AUTO_COMPLETION_TOLERANCE_MINUTES = 10;
let BookingsAutoCompletionService = BookingsAutoCompletionService_1 = class BookingsAutoCompletionService {
    bookingsRepository;
    bookingsEventsService;
    configService;
    logger = new common_1.Logger(BookingsAutoCompletionService_1.name);
    enabled;
    intervalMs;
    toleranceMs;
    timer = null;
    isRunning = false;
    constructor(bookingsRepository, bookingsEventsService, configService) {
        this.bookingsRepository = bookingsRepository;
        this.bookingsEventsService = bookingsEventsService;
        this.configService = configService;
        this.enabled = this.getBooleanConfig('BOOKINGS_AUTO_COMPLETION_ENABLED', true);
        this.intervalMs = this.getPositiveIntegerConfig('BOOKINGS_AUTO_COMPLETION_INTERVAL_MS', DEFAULT_AUTO_COMPLETION_INTERVAL_MS);
        this.toleranceMs =
            this.getPositiveIntegerConfig('BOOKINGS_AUTO_COMPLETION_TOLERANCE_MINUTES', DEFAULT_AUTO_COMPLETION_TOLERANCE_MINUTES) *
                60 *
                1000;
    }
    onModuleInit() {
        if (!this.enabled) {
            this.logger.log('Booking auto-completion worker disabled by configuration');
            return;
        }
        this.timer = setInterval(() => {
            void this.completeDueBookings();
        }, this.intervalMs);
        void this.completeDueBookings();
        this.logger.log(`Booking auto-completion worker started every ${this.intervalMs}ms with ${this.toleranceMs}ms tolerance`);
    }
    onModuleDestroy() {
        if (!this.timer) {
            return;
        }
        clearInterval(this.timer);
        this.timer = null;
    }
    async completeDueBookings() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        try {
            const cutoff = new Date(Date.now() - this.toleranceMs);
            const completedBookings = await this.bookingsRepository.markConfirmedBookingsCompletedAfter(cutoff);
            for (const booking of completedBookings) {
                this.bookingsEventsService.emitChange({
                    type: 'updated',
                    businessId: Number(booking.business_id),
                    bookingId: Number(booking.id),
                });
            }
            if (completedBookings.length > 0) {
                this.logger.log(`Auto-completed ${completedBookings.length} confirmed bookings`);
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`Booking auto-completion worker failed: ${message}`);
        }
        finally {
            this.isRunning = false;
        }
    }
    getBooleanConfig(key, defaultValue) {
        const value = this.configService.get(key);
        if (value === undefined || value === null || value === '') {
            return defaultValue;
        }
        return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
    }
    getPositiveIntegerConfig(key, defaultValue) {
        const value = this.configService.get(key);
        if (value === undefined || value === null || value === '') {
            return defaultValue;
        }
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            this.logger.warn(`${key} must be a positive integer. Using default ${defaultValue}`);
            return defaultValue;
        }
        return parsed;
    }
};
exports.BookingsAutoCompletionService = BookingsAutoCompletionService;
exports.BookingsAutoCompletionService = BookingsAutoCompletionService = BookingsAutoCompletionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bookings_repository_1.BookingsRepository,
        bookings_events_service_1.BookingsEventsService,
        config_1.ConfigService])
], BookingsAutoCompletionService);
//# sourceMappingURL=bookings-auto-completion.service.js.map