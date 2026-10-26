export declare class CreatePaymentDto {
    booking_id: number;
    amount: number;
    method: string;
    status?: string;
    paid_at?: string | null;
    reference?: string | null;
}
