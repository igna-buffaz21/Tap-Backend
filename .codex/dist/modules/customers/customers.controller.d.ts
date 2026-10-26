import { User } from '../users/entities/user.entity';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    create(createCustomerDto: CreateCustomerDto, currentUser: User, businessId?: string): Promise<import("./entities/customer.entity").Customer>;
    findAll(currentUser: User, businessId?: string, page?: string, limit?: string, search?: string): Promise<{
        data: {
            id: number;
            name: string;
            phone: string;
            email: string;
            customerSince: string | Date;
            createdAt: Date;
            updatedAt: Date;
            bookingsCount: number;
            noShowCount: number;
            cancellationsCount: number;
            customerType: import("../bookings/booking.constants").CustomerFrequencyType;
            lastBookingAt: string | Date | null;
            nextBookingAt: string | Date | null;
        }[];
        pagination: import("./customers.service").Pagination;
    }>;
    getStats(currentUser: User, businessId?: string): Promise<{
        businessId: number;
        totalCustomers: number;
        newCustomersThisMonth: number;
    }>;
    findByPhone(currentUser: User, phone: string, businessId?: string): Promise<import("./entities/customer.entity").Customer | null>;
    findOne(id: string, currentUser: User, businessId?: string, historyPage?: string, historyLimit?: string): Promise<{
        id: number;
        name: string;
        phone: string;
        email: string;
        customerSince: string;
        customerSinceDate: string;
        createdAt: Date;
        updatedAt: Date;
        stats: {
            bookingsCount: number;
            noShowCount: number;
            cancellationsCount: number;
            customerType: import("../bookings/booking.constants").CustomerFrequencyType;
            lastBookingAt: string | null;
            lastBookingDate: string | null;
        };
        history: {
            data: {
                id: number;
                startAt: string;
                endAt: string;
                date: string;
                shortDate: string;
                time: string;
                branch: {
                    id: number;
                    name: string;
                };
                resource: {
                    id: number;
                    name: string;
                };
                service: {
                    id: number;
                    name: string;
                };
                status: string;
                statusLabel: string;
                confirmationStatus: string;
                cancelledAt: string | null;
                source: string;
                totalPrice: number;
                reservationName: string | null;
                notes: string | null;
            }[];
            pagination: import("./customers.service").Pagination;
        };
    }>;
    update(id: string, updateCustomerDto: UpdateCustomerDto, currentUser: User, businessId?: string): Promise<import("./entities/customer.entity").Customer>;
    remove(id: string, currentUser: User, businessId?: string): Promise<{
        deleted: boolean;
    }>;
}
