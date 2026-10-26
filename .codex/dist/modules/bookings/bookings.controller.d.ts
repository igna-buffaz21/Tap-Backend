import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { User } from '../users/entities/user.entity';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateFixedBookingsDto } from './dto/create-fixed-bookings.dto';
import { GetBookingsQueryDto } from './dto/get-bookings-query.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
export declare class BookingsController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    create(createBookingDto: CreateBookingDto, currentUser: User, businessId?: string): Promise<{
        id: number;
        businessId: number;
        branchId: number;
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
        customerId: number | null;
        startAt: string;
        endAt: string;
        status: string;
        confirmationStatus: string;
        reconfirmedAt: Date | null;
        cancelledAt: Date | null;
        source: string;
        totalPrice: number;
        reservationName: string | null;
        notes: string | null;
        recurringBookingId: number | null;
        reminder: {
            id: number;
            channel: string;
            messageType: string;
            scheduledAt: string;
            validUntil: string;
            status: string;
        } | null;
    }>;
    createFixed(createFixedBookingsDto: CreateFixedBookingsDto, currentUser: User, businessId?: string): Promise<{
        businessId: number;
        branchId: number;
        serviceId: number;
        customerId: number;
        source: string;
        reservationName: string;
        periodMonths: 6 | 3 | 12;
        recurringBookingId: number;
        occurrenceCount: number;
        bookings: {
            id: number;
            businessId: number;
            branchId: number;
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
            customerId: number | null;
            startAt: string;
            endAt: string;
            status: string;
            confirmationStatus: string;
            reconfirmedAt: Date | null;
            cancelledAt: Date | null;
            source: string;
            totalPrice: number;
            reservationName: string | null;
            notes: string | null;
            recurringBookingId: number | null;
            reminder: {
                id: number;
                channel: string;
                messageType: string;
                scheduledAt: string;
                validUntil: string;
                status: string;
            } | null;
        }[];
    }>;
    findAll(query: GetBookingsQueryDto, currentUser: User): Observable<MessageEvent>;
    findOne(id: string, currentUser: User, businessId?: string): Promise<import("./dto/bookings-service.dto").DetailedBookingResponse>;
    update(id: string, updateBookingDto: UpdateBookingDto, currentUser: User, businessId?: string): Promise<import("./entities/booking.entity").Booking>;
    reconfirm(id: string, currentUser: User, businessId?: string): Promise<import("./entities/booking.entity").Booking>;
    cancelFromReminder(id: string, currentUser: User, businessId?: string): Promise<import("./entities/booking.entity").Booking>;
    remove(id: string, currentUser: User, businessId?: string): Promise<{
        deleted: boolean;
    }>;
}
