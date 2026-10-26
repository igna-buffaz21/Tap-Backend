export declare class CreateBookingDto {
    businessId?: number;
    branchId: number;
    resourceId?: number | null;
    serviceId: number;
    customerId?: number | null;
    customerPhone?: string;
    startAt: string;
    source: string;
    resourceIsIndoor?: boolean | null;
    reservationName?: string | null;
    notes?: string | null;
}
