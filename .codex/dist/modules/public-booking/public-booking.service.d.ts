import { AvailabilityService } from '../availability/availability.service';
import { BookingsService } from '../bookings/bookings.service';
import { BranchOpeningHours } from '../branches/entities/branch.entity';
import { CustomersService } from '../customers/customers.service';
import { CancelPublicBookingByPhoneDto } from './dto/cancel-public-booking-by-phone.dto';
import { CancelPublicBookingDto } from './dto/cancel-public-booking.dto';
import { CreatePublicBookingDto } from './dto/create-public-booking.dto';
import { GetPublicAvailabilityDto } from './dto/get-public-availability.dto';
import { GetPublicBookingsByPhoneQueryDto } from './dto/get-public-bookings-by-phone-query.dto';
import { GetPublicBookingsQueryDto } from './dto/get-public-bookings-query.dto';
import { PublicBookingRepository } from './public-booking.repository';
export declare class PublicBookingService {
    private readonly publicBookingRepository;
    private readonly availabilityService;
    private readonly bookingsService;
    private readonly customersService;
    constructor(publicBookingRepository: PublicBookingRepository, availabilityService: AvailabilityService, bookingsService: BookingsService, customersService: CustomersService);
    findBranch(slug: string): Promise<{
        id: number;
        slug: string;
        name: string;
        business: {
            id: number;
            name: string;
        };
        description: string | null;
        logoUrl: string | null;
        coverImageUrl: string | null;
        primaryColor: string | null;
        instagramUrl: string | null;
        facebookUrl: string | null;
        address: string | null;
        phone: string | null;
        lat: number | null;
        lng: number | null;
        openingHours: BranchOpeningHours | null;
        timezone: string;
    }>;
    findServices(slug: string): Promise<{
        branch: {
            id: number;
            slug: string;
            name: string;
            logoUrl: string | null;
            coverImageUrl: string | null;
            businessId: number;
        };
        services: {
            id: number;
            name: string;
            durationMinutes: number;
            price: number;
            resourceSelectionMode: "AUTO" | "OPTIONAL" | "REQUIRED";
            iconKey: string | null | undefined;
            imageUrl: string | null | undefined;
        }[];
    }>;
    findServiceResources(slug: string, serviceIdValue: unknown): Promise<{
        service: {
            id: number;
            name: string;
            durationMinutes: number;
            resourceSelectionMode: "AUTO" | "OPTIONAL" | "REQUIRED";
            iconKey: string | null | undefined;
            imageUrl: string | null | undefined;
        };
        resources: {
            id: number;
            name: string;
            type: string | null;
            photoUrl: string | null;
            isIndoor: boolean | null;
            priority: number;
        }[];
    }>;
    findAvailability(slug: string, query: GetPublicAvailabilityDto): Promise<import("../bookings/booking-rules.service").AvailabilityResponse>;
    findBookings(slug: string, query: GetPublicBookingsQueryDto): Promise<{
        branch: {
            id: number;
            slug: string;
            name: string;
            logoUrl: string | null;
            coverImageUrl: string | null;
            businessId: number;
        };
        bookings: {
            id: number;
            startAt: string;
            endAt: string;
            status: string;
            confirmationStatus: string;
            reconfirmedAt: string | Date | null;
            cancelledAt: string | Date | null;
            totalPrice: number;
            reservationName: string | null;
            notes: string | null;
            service: {
                id: number;
                name: string;
            };
            resource: {
                id: number;
                name: string;
                isIndoor: boolean | null;
            };
            customer: {
                name: string;
                phone: string;
                email: string;
            };
        }[];
    }>;
    findBookingsByPhone(slug: string, query: GetPublicBookingsByPhoneQueryDto): Promise<{
        branch: {
            id: number;
            slug: string;
            name: string;
            logoUrl: string | null;
            coverImageUrl: string | null;
            businessId: number;
        };
        bookings: {
            id: number;
            startAt: string;
            endAt: string;
            status: string;
            confirmationStatus: string;
            reconfirmedAt: string | Date | null;
            cancelledAt: string | Date | null;
            totalPrice: number;
            reservationName: string | null;
            notes: string | null;
            service: {
                id: number;
                name: string;
            };
            resource: {
                id: number;
                name: string;
                isIndoor: boolean | null;
            };
            customer: {
                name: string;
                phone: string;
                email: string;
            };
        }[];
    }>;
    cancelBooking(slug: string, bookingIdValue: unknown, dto: CancelPublicBookingDto): Promise<{
        id: number;
        startAt: string;
        endAt: string;
        status: string;
        confirmationStatus: string;
        reconfirmedAt: string | Date | null;
        cancelledAt: string | Date | null;
        totalPrice: number;
        reservationName: string | null;
        notes: string | null;
        service: {
            id: number;
            name: string;
        };
        resource: {
            id: number;
            name: string;
            isIndoor: boolean | null;
        };
        customer: {
            name: string | null;
        };
    }>;
    cancelBookingByPhone(slug: string, bookingIdValue: unknown, dto: CancelPublicBookingByPhoneDto): Promise<{
        id: number;
        startAt: string;
        endAt: string;
        status: string;
        confirmationStatus: string;
        reconfirmedAt: string | Date | null;
        cancelledAt: string | Date | null;
        totalPrice: number;
        reservationName: string | null;
        notes: string | null;
        service: {
            id: number;
            name: string;
        };
        resource: {
            id: number;
            name: string;
            isIndoor: boolean | null;
        };
        customer: {
            name: string | null;
        };
    }>;
    createBooking(slug: string, dto: CreatePublicBookingDto): Promise<{
        customer: {
            id: number;
            name: string;
            phone: string;
            email: string;
        };
        id: number;
        businessId: number;
        branchId: number;
        resource: {
            id: number;
            name: string;
            priority: number;
            isIndoor: boolean | null;
        };
        service: {
            id: number;
            name: string;
        };
        customerId: number | null;
        startAt: string;
        endAt: string;
        status: string;
        confirmationStatus: string;
        reconfirmedAt: Date | null;
        cancelledAt: Date | null;
        source: string;
        totalPrice: number;
        reservationName: string | null;
        notes: string | null;
        recurringBookingId: number | null;
        reminder: {
            id: number;
            channel: string;
            messageType: string;
            scheduledAt: string;
            validUntil: string;
            status: string;
        } | null;
    }>;
    private resolvePublicBranch;
    private mapBranch;
    private mapBranchSummary;
    private mapNullableNumber;
    private mapOpeningHours;
    private mapPublicBooking;
    private mapPublicDetailedBooking;
    private validateSlug;
    private validateNonEmptyString;
    private validateEmail;
    private validatePhone;
    private validateNullableString;
    private parsePositiveInteger;
    private parseOptionalPositiveInteger;
}
