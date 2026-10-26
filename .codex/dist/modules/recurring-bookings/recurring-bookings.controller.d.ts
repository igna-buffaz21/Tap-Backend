import { User } from '../users/entities/user.entity';
import { CreateRecurringBookingDto } from './dto/create-recurring-booking.dto';
import { UpdateRecurringBookingDto } from './dto/update-recurring-booking.dto';
import { RecurringBookingsService } from './recurring-bookings.service';
export declare class RecurringBookingsController {
    private readonly recurringBookingsService;
    constructor(recurringBookingsService: RecurringBookingsService);
    create(createRecurringBookingDto: CreateRecurringBookingDto, currentUser: User, businessId?: string): Promise<import("./entities/recurring-booking.entity").RecurringBooking>;
    findAll(currentUser: User, businessId?: string, search?: string, page?: string, limit?: string): Promise<{
        data: {
            id: number;
            status: string;
            customer: {
                id: number;
                name: string;
                phone: string;
            };
            service: {
                id: number;
                name: string;
            };
            resource: {
                id: number;
                name: string;
            };
            schedule: {
                day_of_week: number;
                start_time: string;
                start_date: string;
                end_date: string;
            };
            next_booking_at: string | null;
        }[];
        pagination: import("./recurring-bookings.service").Pagination;
    }>;
    findOne(id: string, currentUser: User, businessId?: string): Promise<{
        id: number;
        status: string;
        customer: {
            id: number;
            name: string;
            phone: string;
        };
        service: {
            id: number;
            name: string;
        };
        resource: {
            id: number;
            name: string;
        };
        schedule: {
            day_of_week: number;
            start_time: string;
            start_date: string;
            end_date: string;
        };
        stats: {
            total: number;
            attended: number;
            pending: number;
            no_show: number;
            cancelled: number;
        };
        next_booking_at: string | null;
    }>;
    update(id: string, updateRecurringBookingDto: UpdateRecurringBookingDto, currentUser: User, businessId?: string): Promise<{
        id: number;
        status: string;
        customer: {
            id: number;
            name: string;
            phone: string;
        };
        service: {
            id: number;
            name: string;
        };
        resource: {
            id: number;
            name: string;
        };
        schedule: {
            day_of_week: number;
            start_time: string;
            start_date: string;
            end_date: string;
        };
        stats: {
            total: number;
            attended: number;
            pending: number;
            no_show: number;
            cancelled: number;
        };
        next_booking_at: string | null;
    }>;
    remove(id: string, currentUser: User, businessId?: string): Promise<{
        deleted: boolean;
    }>;
}
