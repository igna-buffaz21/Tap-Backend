"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FREQUENT_CUSTOMER_MIN_BOOKINGS = exports.FREQUENT_CUSTOMER_WINDOW_DAYS = exports.BOOKING_CONFIRMATION_STATUSES = exports.BOOKING_SOURCES = exports.BOOKING_STATUSES = exports.ACTIVE_BOOKING_STATUSES = void 0;
exports.ACTIVE_BOOKING_STATUSES = ['PENDING', 'CONFIRMED'];
exports.BOOKING_STATUSES = [
    ...exports.ACTIVE_BOOKING_STATUSES,
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
];
exports.BOOKING_SOURCES = ['WEB', 'WHATSAPP', 'ADMIN'];
exports.BOOKING_CONFIRMATION_STATUSES = [
    'not_required',
    'pending',
    'reconfirmed',
];
exports.FREQUENT_CUSTOMER_WINDOW_DAYS = 90;
exports.FREQUENT_CUSTOMER_MIN_BOOKINGS = 3;
//# sourceMappingURL=booking.constants.js.map