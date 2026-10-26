import { DatabaseService } from '../../database/database.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './entities/payment.entity';
export interface BookingPaymentSummary {
    booking_id: number;
    total_price: number;
    paid_amount: number;
}
export declare class PaymentsRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    create(createPaymentDto: CreatePaymentDto): Promise<Payment>;
    findBookingPaymentSummary(bookingId: number): Promise<BookingPaymentSummary | null>;
    findAll(): Promise<Payment[]>;
    findById(id: number): Promise<Payment | null>;
    update(id: number, updatePaymentDto: UpdatePaymentDto): Promise<Payment | null>;
    remove(id: number): Promise<boolean>;
}
