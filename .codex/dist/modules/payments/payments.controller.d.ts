import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    create(createPaymentDto: CreatePaymentDto): Promise<{
        id: number;
        bookingId: number;
        amount: number;
        method: string;
        status: string;
        paidAt: Date | null;
        reference: string | null;
        bookingTotalPrice: number;
        bookingPaidAmount: number;
        bookingRemainingAmount: number;
    }>;
    findAll(): Promise<import("./entities/payment.entity").Payment[]>;
    findOne(id: string): Promise<import("./entities/payment.entity").Payment | null>;
    update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<import("./entities/payment.entity").Payment | null>;
    remove(id: string): Promise<boolean>;
}
