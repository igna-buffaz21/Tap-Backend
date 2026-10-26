import { User } from '../users/entities/user.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerFrequencyType } from '../bookings/booking.constants';
import { CustomersRepository } from './customers.repository';
import { Customer } from './entities/customer.entity';
export interface GetOrCreateCustomerByPhoneInput {
    phone: string;
    name?: string | null;
    email?: string | null;
}
export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export declare class CustomersService {
    private readonly customersRepository;
    constructor(customersRepository: CustomersRepository);
    create(createCustomerDto: CreateCustomerDto): Promise<Customer>;
    createForBusiness(createCustomerDto: CreateCustomerDto, currentUser: User, businessIdValue?: unknown): Promise<Customer>;
    findAll(): Promise<Customer[]>;
    getStatsForBusiness(currentUser: User, businessIdValue?: unknown): Promise<{
        businessId: number;
        totalCustomers: number;
        newCustomersThisMonth: number;
    }>;
    findAllForBusiness(currentUser: User, businessIdValue?: unknown, pageValue?: unknown, limitValue?: unknown, searchValue?: unknown): Promise<{
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
            customerType: CustomerFrequencyType;
            lastBookingAt: string | Date | null;
            nextBookingAt: string | Date | null;
        }[];
        pagination: Pagination;
    }>;
    findOne(id: number): Promise<Customer | null>;
    findOneForBusiness(id: number, currentUser: User, businessIdValue?: unknown, historyPageValue?: unknown, historyLimitValue?: unknown): Promise<{
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
            customerType: CustomerFrequencyType;
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
            pagination: Pagination;
        };
    }>;
    findByPhone(phone: string): Promise<Customer | null>;
    findByPhoneForBusiness(phoneValue: unknown, currentUser: User, businessIdValue?: unknown): Promise<Customer | null>;
    getOrCreateByPhone(input: GetOrCreateCustomerByPhoneInput): Promise<Customer>;
    addToBusiness(customerId: number, businessId: number, executor?: Parameters<CustomersRepository['addToBusiness']>[2]): Promise<void>;
    update(id: number, updateCustomerDto: UpdateCustomerDto): Promise<Customer | null>;
    updateForBusiness(id: number, updateCustomerDto: UpdateCustomerDto, currentUser: User, businessIdValue?: unknown): Promise<Customer>;
    remove(id: number): Promise<boolean>;
    removeFromBusiness(id: number, currentUser: User, businessIdValue?: unknown): Promise<{
        deleted: boolean;
    }>;
    private resolveCustomerAccess;
    private buildCustomerAccessFilter;
    private requireBusinessUserBusinessId;
    private parsePositiveInteger;
    private parsePhone;
    private assertBusinessExists;
    private normalizeUpdateDto;
    private assertOnlyEditableUpdateFields;
    private parsePagination;
    private parseSearch;
    private toLikePattern;
    private buildPagination;
    private mapCustomerListItem;
    private mapCustomerDetail;
    private resolveCustomerFrequencyType;
    private mapCustomerBookingHistory;
    private formatNullableInstant;
    private formatNullableDate;
    private formatNullableDateTime;
    private formatInstant;
    private formatDate;
    private formatShortDate;
    private formatTime;
    private formatDateTime;
    private toDate;
    private getBookingStatusLabel;
    private isUniqueViolation;
    private normalizeEmail;
}
