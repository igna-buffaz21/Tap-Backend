export declare class CreateFixedBookingsDto {
    businessId?: number;
    branchId: number;
    resourceId?: number | null;
    serviceId: number;
    customerId?: number | null;
    customerPhone?: string;
    startAt: string;
    periodMonths: 3 | 6 | 12;
    reservationName: string;
    source?: string;
    resourceIsIndoor?: boolean | null;
}
