export declare class CreatePublicBookingCustomerDto {
    name: string;
    phone: string;
    email?: string | null;
}
export declare class CreatePublicBookingDto {
    serviceId: number;
    resourceId?: number | null;
    startAt: string;
    resourceIsIndoor?: boolean | null;
    customer: CreatePublicBookingCustomerDto;
    notes?: string | null;
}
