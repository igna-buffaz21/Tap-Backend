export declare class Payment {
    id: number;
    booking_id: number;
    amount: number;
    status: string;
    method: string;
    paid_at: Date | null;
    reference: string | null;
    created_at: Date;
    updated_at: Date;
}
