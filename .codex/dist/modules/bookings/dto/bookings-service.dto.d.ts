import type { BookingRulesService } from '../booking-rules.service';
import type { BookingChangeEvent } from '../bookings-events.service';
import type { Booking } from '../entities/booking.entity';
import type { Reminder } from '../../reminders/entities/reminder.entity';
import type { CustomerFrequencyType } from '../booking.constants';
export interface CreatedBookingResult {
    booking: Booking;
    reminder: Reminder | null;
}
export interface ValidatedFixedBookingOccurrence {
    startAt: Date;
    endAt: Date;
    context: Awaited<ReturnType<BookingRulesService['validateBookingContext']>>;
}
export interface CustomerUpcomingBookingsInput {
    businessId: unknown;
    customerId: unknown;
    branchId?: unknown;
    date?: unknown;
    limit?: unknown;
    now?: Date;
}
export interface CancelCustomerBookingInput {
    bookingId: unknown;
    businessId: unknown;
    customerId: unknown;
}
export interface DetailedBookingResponse {
    id: number;
    startAt: string;
    endAt: string;
    status: string;
    confirmationStatus: string;
    reconfirmedAt: Date | string | null;
    cancelledAt: Date | string | null;
    source: string;
    totalPrice: number;
    reservationName: string | null;
    notes: string | null;
    recurringBookingId: number | null;
    branch: {
        id: number;
        name: string;
    };
    resource: {
        id: number;
        name: string;
        priority: number;
        isIndoor: boolean | null;
    };
    service: {
        id: number;
        name: string;
    };
    customer: {
        id: number;
        name: string;
        phone: string;
        noShowCount?: number;
        customerType?: CustomerFrequencyType;
    } | null;
}
export interface BookingsListResponse {
    data: DetailedBookingResponse[];
}
export type BookingsStreamPayload = {
    event: 'snapshot' | 'bookings.changed';
    data: DetailedBookingResponse[];
    change?: BookingChangeEvent;
    emittedAt: string;
} | {
    event: 'ping';
    emittedAt: string;
};
export interface ResolveCustomerCancellationInput extends CustomerUpcomingBookingsInput {
    messageText: string;
    selectedBookingId?: unknown;
}
export type CustomerCancellationResolution = {
    action: 'NO_ACTIVE_BOOKINGS';
    bookings: DetailedBookingResponse[];
} | {
    action: 'CANCELLED';
    booking: DetailedBookingResponse;
    bookings: DetailedBookingResponse[];
} | {
    action: 'CONFIRM_CANCELLATION';
    booking: DetailedBookingResponse;
    bookings: DetailedBookingResponse[];
} | {
    action: 'SELECT_BOOKING';
    bookings: DetailedBookingResponse[];
};
