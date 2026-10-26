import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentsRepository } from './payments.repository';
export declare class PaymentsService {
    private readonly paymentsRepository;
    constructor(paymentsRepository: PaymentsRepository);
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
    findOne(id: number): Promise<import("./entities/payment.entity").Payment | null>;
    update(id: number, updatePaymentDto: UpdatePaymentDto): Promise<import("./entities/payment.entity").Payment | null>;
    remove(id: number): Promise<boolean>;
    private parsePositiveInteger;
    private parsePositiveAmount;
    private validateMethod;
    private validateStatus;
    private resolvePaidAt;
    private validateReference;
}
