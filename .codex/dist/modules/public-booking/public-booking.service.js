"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicBookingService = void 0;
const common_1 = require("@nestjs/common");
const phone_1 = require("../../common/utils/phone");
const timezone_1 = require("../../common/utils/timezone");
const availability_service_1 = require("../availability/availability.service");
const bookings_service_1 = require("../bookings/bookings.service");
const customers_service_1 = require("../customers/customers.service");
const public_booking_repository_1 = require("./public-booking.repository");
const PUBLIC_BOOKINGS_LIMIT = 20;
let PublicBookingService = class PublicBookingService {
    publicBookingRepository;
    availabilityService;
    bookingsService;
    customersService;
    constructor(publicBookingRepository, availabilityService, bookingsService, customersService) {
        this.publicBookingRepository = publicBookingRepository;
        this.availabilityService = availabilityService;
        this.bookingsService = bookingsService;
        this.customersService = customersService;
    }
    async findBranch(slug) {
        const branch = await this.resolvePublicBranch(slug);
        return this.mapBranch(branch);
    }
    async findServices(slug) {
        const branch = await this.resolvePublicBranch(slug);
        const services = await this.availabilityService.findActiveServicesForBranch(branch.business_id, branch.id, 50);
        return {
            branch: this.mapBranchSummary(branch),
            services: services.map((service) => ({
                id: service.id,
                name: service.name,
                durationMinutes: Number(service.duration_minutes),
                price: Number(service.price),
                resourceSelectionMode: service.resource_selection_mode,
                iconKey: service.icon_key,
                imageUrl: service.image_url,
            })),
        };
    }
    async findServiceResources(slug, serviceIdValue) {
        const branch = await this.resolvePublicBranch(slug);
        const serviceId = this.parsePositiveInteger(serviceIdValue, 'serviceId');
        const service = await this.availabilityService.findActiveServiceForBranch(branch.business_id, branch.id, serviceId);
        if (!service) {
            throw new common_1.NotFoundException('Service not found for branch');
        }
        const resources = await this.availabilityService.findEligibleResourcesForService(branch.business_id, branch.id, service.id);
        return {
            service: {
                id: service.id,
                name: service.name,
                durationMinutes: Number(service.duration_minutes),
                resourceSelectionMode: service.resource_selection_mode,
                iconKey: service.icon_key,
                imageUrl: service.image_url,
            },
            resources: resources.map((resource) => ({
                id: resource.id,
                name: resource.name,
                type: resource.type,
                photoUrl: resource.photo_url,
                isIndoor: resource.is_indoor,
                priority: resource.priority,
            })),
        };
    }
    async findAvailability(slug, query) {
        const branch = await this.resolvePublicBranch(slug);
        return this.availabilityService.findAvailability({
            businessId: String(branch.business_id),
            branchId: String(branch.id),
            serviceId: query.serviceId,
            date: query.date,
            resourceId: query.resourceId,
            resourceIsIndoor: query.resourceIsIndoor,
        });
    }
    async findBookings(slug, query) {
        const branch = await this.resolvePublicBranch(slug);
        const email = this.validateEmail(query.email, 'email');
        const bookings = await this.publicBookingRepository.findUpcomingBookingsByCustomerEmail({
            businessId: branch.business_id,
            branchId: branch.id,
            email,
            now: new Date(),
            limit: PUBLIC_BOOKINGS_LIMIT,
        });
        return {
            branch: this.mapBranchSummary(branch),
            bookings: bookings.map((booking) => this.mapPublicBooking(booking, branch.timezone)),
        };
    }
    async findBookingsByPhone(slug, query) {
        const branch = await this.resolvePublicBranch(slug);
        const phone = this.validatePhone(query.phone, 'phone');
        const bookings = await this.publicBookingRepository.findUpcomingBookingsByCustomerPhone({
            businessId: branch.business_id,
            branchId: branch.id,
            phones: (0, phone_1.buildPhoneLookupCandidates)(phone),
            now: new Date(),
            limit: PUBLIC_BOOKINGS_LIMIT,
        });
        return {
            branch: this.mapBranchSummary(branch),
            bookings: bookings.map((booking) => this.mapPublicBooking(booking, branch.timezone)),
        };
    }
    async cancelBooking(slug, bookingIdValue, dto) {
        const branch = await this.resolvePublicBranch(slug);
        const bookingId = this.parsePositiveInteger(bookingIdValue, 'bookingId');
        const email = this.validateEmail(dto.email, 'email');
        const bookingMatch = await this.publicBookingRepository.findActiveBookingCustomerByEmail({
            businessId: branch.business_id,
            branchId: branch.id,
            bookingId,
            email,
            now: new Date(),
        });
        if (!bookingMatch) {
            throw new common_1.NotFoundException('Active booking not found for email');
        }
        return this.mapPublicDetailedBooking(await this.bookingsService.cancelActiveForCustomer({
            bookingId,
            businessId: branch.business_id,
            customerId: bookingMatch.customer_id,
        }));
    }
    async cancelBookingByPhone(slug, bookingIdValue, dto) {
        const branch = await this.resolvePublicBranch(slug);
        const bookingId = this.parsePositiveInteger(bookingIdValue, 'bookingId');
        const phone = this.validatePhone(dto.phone, 'phone');
        const bookingMatch = await this.publicBookingRepository.findActiveBookingCustomerByPhone({
            businessId: branch.business_id,
            branchId: branch.id,
            bookingId,
            phones: (0, phone_1.buildPhoneLookupCandidates)(phone),
            now: new Date(),
        });
        if (!bookingMatch) {
            throw new common_1.NotFoundException('Active booking not found for phone');
        }
        return this.mapPublicDetailedBooking(await this.bookingsService.cancelActiveForCustomer({
            bookingId,
            businessId: branch.business_id,
            customerId: bookingMatch.customer_id,
        }));
    }
    async createBooking(slug, dto) {
        const branch = await this.resolvePublicBranch(slug);
        const customerName = this.validateNonEmptyString(dto.customer?.name, 'customer.name');
        const customerPhone = this.validateNonEmptyString(dto.customer?.phone, 'customer.phone');
        const customerEmail = dto.customer?.email === undefined
            ? undefined
            : this.validateEmail(dto.customer.email, 'customer.email');
        const customer = await this.customersService.getOrCreateByPhone({
            name: customerName,
            phone: customerPhone,
            email: customerEmail,
        });
        await this.customersService.addToBusiness(customer.id, branch.business_id);
        const booking = await this.bookingsService.create({
            businessId: branch.business_id,
            branchId: branch.id,
            serviceId: this.parsePositiveInteger(dto.serviceId, 'serviceId'),
            resourceId: this.parseOptionalPositiveInteger(dto.resourceId, 'resourceId'),
            startAt: dto.startAt,
            source: 'WEB',
            resourceIsIndoor: dto.resourceIsIndoor === null ? undefined : dto.resourceIsIndoor,
            reservationName: customerName,
            notes: this.validateNullableString(dto.notes, 'notes'),
            customerId: customer.id,
        });
        return {
            ...booking,
            customer: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
            },
        };
    }
    async resolvePublicBranch(slugValue) {
        const slug = this.validateSlug(slugValue);
        const branches = await this.publicBookingRepository.findActiveBranchesBySlug(slug);
        if (branches.length === 0) {
            throw new common_1.NotFoundException('Branch not found');
        }
        if (branches.length > 1) {
            throw new common_1.ConflictException('Branch slug is ambiguous');
        }
        return branches[0];
    }
    mapBranch(branch) {
        return {
            id: branch.id,
            slug: branch.slug,
            name: branch.name,
            business: {
                id: branch.business_id,
                name: branch.business_name,
            },
            description: branch.description,
            logoUrl: branch.logo_url,
            coverImageUrl: branch.cover_image_url,
            primaryColor: branch.primary_color,
            instagramUrl: branch.instagram_url,
            facebookUrl: branch.facebook_url,
            address: branch.address,
            phone: branch.phone,
            lat: this.mapNullableNumber(branch.lat),
            lng: this.mapNullableNumber(branch.lng),
            openingHours: this.mapOpeningHours(branch.opening_hours),
            timezone: branch.timezone,
        };
    }
    mapBranchSummary(branch) {
        return {
            id: branch.id,
            slug: branch.slug,
            name: branch.name,
            logoUrl: branch.logo_url,
            coverImageUrl: branch.cover_image_url,
            businessId: branch.business_id,
        };
    }
    mapNullableNumber(value) {
        return value === null ? null : Number(value);
    }
    mapOpeningHours(value) {
        return typeof value === 'string'
            ? JSON.parse(value)
            : value;
    }
    mapPublicBooking(booking, timeZone) {
        const startAt = booking.start_at instanceof Date
            ? booking.start_at
            : new Date(booking.start_at);
        const endAt = booking.end_at instanceof Date
            ? booking.end_at
            : new Date(booking.end_at);
        return {
            id: booking.id,
            startAt: (0, timezone_1.formatInTimeZone)(startAt, timeZone),
            endAt: (0, timezone_1.formatInTimeZone)(endAt, timeZone),
            status: booking.status,
            confirmationStatus: booking.confirmation_status,
            reconfirmedAt: booking.reconfirmed_at,
            cancelledAt: booking.cancelled_at,
            totalPrice: Number(booking.total_price),
            reservationName: booking.reservation_name,
            notes: booking.notes,
            service: {
                id: booking.service_id,
                name: booking.service_name,
            },
            resource: {
                id: booking.resource_id,
                name: booking.resource_name,
                isIndoor: booking.resource_is_indoor,
            },
            customer: {
                name: booking.customer_name,
                phone: booking.customer_phone,
                email: booking.customer_email,
            },
        };
    }
    mapPublicDetailedBooking(booking) {
        return {
            id: booking.id,
            startAt: booking.startAt,
            endAt: booking.endAt,
            status: booking.status,
            confirmationStatus: booking.confirmationStatus,
            reconfirmedAt: booking.reconfirmedAt,
            cancelledAt: booking.cancelledAt,
            totalPrice: booking.totalPrice,
            reservationName: booking.reservationName,
            notes: booking.notes,
            service: booking.service,
            resource: {
                id: booking.resource.id,
                name: booking.resource.name,
                isIndoor: booking.resource.isIndoor,
            },
            customer: {
                name: booking.customer?.name ?? booking.reservationName,
            },
        };
    }
    validateSlug(value) {
        const slug = this.validateNonEmptyString(value, 'slug');
        if (slug.length > 150) {
            throw new common_1.BadRequestException('slug must be 150 characters or less');
        }
        return slug;
    }
    validateNonEmptyString(value, fieldName) {
        if (typeof value !== 'string' || value.trim().length === 0) {
            throw new common_1.BadRequestException(`${fieldName} must be a non-empty string`);
        }
        return value.trim();
    }
    validateEmail(value, fieldName) {
        const email = this.validateNonEmptyString(value, fieldName).toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new common_1.BadRequestException(`${fieldName} must be a valid email`);
        }
        if (email.length > 255) {
            throw new common_1.BadRequestException(`${fieldName} must be 255 characters or less`);
        }
        return email;
    }
    validatePhone(value, fieldName) {
        const phone = this.validateNonEmptyString(value, fieldName);
        if (phone.replace(/\D/g, '').length === 0) {
            throw new common_1.BadRequestException(`${fieldName} must contain digits`);
        }
        return phone;
    }
    validateNullableString(value, fieldName) {
        if (value === undefined || value === null) {
            return null;
        }
        if (typeof value !== 'string') {
            throw new common_1.BadRequestException(`${fieldName} must be a string or null`);
        }
        return value.trim() || null;
    }
    parsePositiveInteger(value, fieldName) {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new common_1.BadRequestException(`${fieldName} must be a positive integer`);
        }
        return parsed;
    }
    parseOptionalPositiveInteger(value, fieldName) {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        return this.parsePositiveInteger(value, fieldName);
    }
};
exports.PublicBookingService = PublicBookingService;
exports.PublicBookingService = PublicBookingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [public_booking_repository_1.PublicBookingRepository,
        availability_service_1.AvailabilityService,
        bookings_service_1.BookingsService,
        customers_service_1.CustomersService])
], PublicBookingService);
//# sourceMappingURL=public-booking.service.js.map