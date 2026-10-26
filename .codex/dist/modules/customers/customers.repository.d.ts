import { QueryResult, QueryResultRow } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';
interface QueryExecutor {
    query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<T>>;
}
export interface CustomerAccessFilter {
    allowedBranchIds?: number[];
    assignedUserId?: number;
    ownOnly?: boolean;
}
export interface CustomerBusinessStatsRow {
    total_customers: number | string;
    new_customers_this_month: number | string;
}
export interface CustomerListRow extends Customer {
    customer_since: Date | string;
    bookings_count: number | string;
    no_show_count: number | string;
    cancellations_count: number | string;
    completed_count: number | string;
    completed_last_window_count: number | string;
    last_booking_at: Date | string | null;
    next_booking_at: Date | string | null;
    total_count: number | string;
}
export interface CustomerDetailRow extends Customer {
    customer_since: Date | string;
    bookings_count: number | string;
    no_show_count: number | string;
    cancellations_count: number | string;
    completed_count: number | string;
    completed_last_window_count: number | string;
    last_booking_at: Date | string | null;
    business_timezone: string;
}
export interface CustomerBookingHistoryRow {
    id: number;
    branch_id: number;
    branch_name: string;
    resource_id: number;
    resource_name: string;
    service_id: number;
    service_name: string;
    start_at: Date | string;
    end_at: Date | string;
    status: string;
    confirmation_status: string;
    cancelled_at: Date | string | null;
    source: string;
    total_price: number | string;
    reservation_name: string | null;
    notes: string | null;
    total_count: number | string;
}
export declare class CustomersRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    create(createCustomerDto: CreateCustomerDto, executor?: QueryExecutor): Promise<Customer>;
    businessExists(businessId: number): Promise<boolean>;
    findAll(): Promise<Customer[]>;
    findById(id: number): Promise<Customer | null>;
    findAllForBusiness(businessId: number): Promise<Customer[]>;
    getStatsForBusiness(businessId: number, accessFilter?: CustomerAccessFilter): Promise<CustomerBusinessStatsRow>;
    findPageForBusiness(businessId: number, limit: number, offset: number, searchPattern: string | null, phoneSearchPatterns: string[], accessFilter?: CustomerAccessFilter): Promise<CustomerListRow[]>;
    findByIdForBusiness(id: number, businessId: number): Promise<Customer | null>;
    findDetailForBusiness(id: number, businessId: number, accessFilter?: CustomerAccessFilter): Promise<CustomerDetailRow | null>;
    findBookingHistoryForBusiness(customerId: number, businessId: number, limit: number, offset: number, allowedBranchIds?: number[]): Promise<CustomerBookingHistoryRow[]>;
    findByPhone(phone: string): Promise<Customer | null>;
    findByPhones(phones: string[]): Promise<Customer | null>;
    findByPhonesForBusiness(phones: string[], businessId: number, accessFilter?: CustomerAccessFilter): Promise<Customer | null>;
    addToBusiness(customerId: number, businessId: number, executor?: QueryExecutor): Promise<void>;
    update(id: number, updateCustomerDto: UpdateCustomerDto): Promise<Customer | null>;
    updateForBusiness(id: number, businessId: number, updateCustomerDto: UpdateCustomerDto, accessFilter?: CustomerAccessFilter): Promise<Customer | null>;
    removeFromBusiness(customerId: number, businessId: number, accessFilter?: CustomerAccessFilter): Promise<boolean>;
    remove(id: number): Promise<boolean>;
    private buildCustomerAccessCondition;
    private buildCustomerBranchPredicate;
    private buildBranchAccessCondition;
}
export {};
