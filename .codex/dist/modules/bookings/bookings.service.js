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
var BookingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const timezone_1 = require("../../common/utils/timezone");
const database_service_1 = require("../../database/database.service");
const reminders_repository_1 = require("../reminders/reminders.repository");
const customers_service_1 = require("../customers/customers.service");
const recurring_bookings_service_1 = require("../recurring-bookings/recurring-bookings.service");
const booking_constants_1 = require("./booking.constants");
const booking_rules_service_1 = require("./booking-rules.service");
const bookings_repository_1 = require("./bookings.repository");
const bookings_events_service_1 = require("./bookings-events.service");
const RECONFIRMATION_REQUIRED_AFTER_MS = 24 * 60 * 60 * 1000;
const RECONFIRMATION_REMINDER_OFFSET_MS = 3 * 60 * 60 * 1000;
const RECONFIRMATION_REMINDER_VALIDITY_MS = 3 * 60 * 60 * 1000;
const RECONFIRMATION_REMINDER_CHANNEL = 'WHATSAPP';
const RECONFIRMATION_REMINDER_MESSAGE_TYPE = 'BOOKING_RECONFIRMATION';
const FIXED_BOOKING_PERIOD_MONTHS = [3, 6, 12];
let BookingsService = BookingsService_1 = class BookingsService {
    bookingsRepository;
    bookingRulesService;
    remindersRepository;
    databaseService;
    bookingsEventsService;
    customersService;
    recurringBookingsService;
    logger = new common_1.Logger(BookingsService_1.name);
    constructor(bookingsRepository, bookingRulesService, remindersRepository, databaseService, bookingsEventsService, customersService, recurringBookingsService) {
        this.bookingsRepository = bookingsRepository;
        this.bookingRulesService = bookingRulesService;
        this.remindersRepository = remindersRepository;
        this.databaseService = databaseService;
        this.bookingsEventsService = bookingsEventsService;
        this.customersService = customersService;
        this.recurringBookingsService = recurringBookingsService;
    }
    async create(createBookingDto, allowedResourceIds) {
        const businessId = this.bookingRulesService.parsePositiveInteger(createBookingDto.businessId, 'businessId');
        const branchId = this.bookingRulesService.parsePositiveInteger(createBookingDto.branchId, 'branchId');
        const resourceId = this.bookingRulesService.parseOptionalPositiveInteger(createBookingDto.resourceId, 'resourceId');
        const serviceId = this.bookingRulesService.parsePositiveInteger(createBookingDto.serviceId, 'serviceId');
        const startAt = this.bookingRulesService.parseInstant(createBookingDto.startAt, 'startAt');
        const source = this.resolveCreateSource(createBookingDto.source);
        const providedCustomerId = this.parseCreateCustomerId(createBookingDto.customerId);
        const reservationName = this.validateNullableString(createBookingDto.reservationName, 'reservationName');
        this.validateCreateCustomerInput(providedCustomerId, source, reservationName, createBookingDto.customerPhone);
        const notes = this.validateNotes(createBookingDto.notes);
        const resourcePreferences = {
            isIndoor: this.bookingRulesService.parseOptionalBoolean(createBookingDto.resourceIsIndoor, 'resourceIsIndoor'),
        };
        await this.assertProvidedCustomerBelongsToBusiness(providedCustomerId, businessId);
        let context;
        try {
            context = await this.bookingRulesService.validateBookingContext(businessId, branchId, serviceId, resourceId, startAt, resourcePreferences, allowedResourceIds);
        }
        catch (error) {
            this.logCreateBookingError(error, {
                phase: 'context_validation',
                businessId,
                branchId,
                resourceId: resourceId ?? null,
                customerId: providedCustomerId ?? null,
                serviceId,
                startAt,
                source,
            });
            throw error;
        }
        this.bookingRulesService.assertInstantIsNowOrFuture(startAt, 'startAt');
        let customerId;
        try {
            customerId = await this.resolveCreateCustomerId(providedCustomerId, source, reservationName, createBookingDto.customerPhone);
        }
        catch (error) {
            this.logCreateBookingError(error, {
                phase: 'customer_resolution',
                businessId,
                branchId,
                resourceId: context.resource.id,
                customerId: providedCustomerId ?? null,
                serviceId,
                startAt,
                source,
            });
            throw error;
        }
        const endAt = new Date(startAt.getTime() + context.service.duration_minutes * 60_000);
        const now = new Date();
        const msUntilStart = startAt.getTime() - now.getTime();
        const hoursUntilStart = msUntilStart / (60 * 60 * 1000);
        const confirmationStatus = this.getInitialConfirmationStatus(startAt);
        try {
            const { booking, reminder } = await this.databaseService.withTransaction(async (client) => {
                await this.customersService.addToBusiness(customerId, businessId, client);
                return this.insertConfirmedBooking({
                    businessId,
                    branchId,
                    resourceId: context.resource.id,
                    customerId,
                    serviceId,
                    startAt,
                    endAt,
                    source,
                    totalPrice: Number(context.service.price),
                    reservationName,
                    notes,
                }, client);
            });
            const response = this.mapCreatedBookingResponse({
                booking,
                reminder,
                businessId,
                branchId,
                context,
                customerId,
                startAt,
                endAt,
            });
            this.bookingsEventsService.emitChange({
                type: 'created',
                businessId,
                bookingId: booking.id,
            });
            return response;
        }
        catch (error) {
            this.logCreateBookingError(error, {
                phase: 'persistence',
                businessId,
                branchId,
                resourceId: context.resource.id,
                customerId,
                serviceId,
                startAt,
                endAt,
                source,
                confirmationStatus,
            });
            if (this.isBookingOverlapDatabaseError(error)) {
                throw new common_1.ConflictException('The selected time slot is no longer available');
            }
            throw error;
        }
    }
    async createForBusiness(createBookingDto, currentUser, businessIdValue) {
        const access = await this.resolveBookingAccess(currentUser, businessIdValue);
        this.assertRequestBusinessMatches(createBookingDto.businessId, access.businessId);
        this.assertCanAccessBookingBranch(access, createBookingDto.branchId);
        return this.create({
            ...createBookingDto,
            businessId: access.businessId,
        }, access.allowedResourceIds);
    }
    async createFixed(createFixedBookingsDto, allowedResourceIds) {
        const businessId = this.bookingRulesService.parsePositiveInteger(createFixedBookingsDto.businessId, 'businessId');
        const branchId = this.bookingRulesService.parsePositiveInteger(createFixedBookingsDto.branchId, 'branchId');
        const resourceId = this.bookingRulesService.parseOptionalPositiveInteger(createFixedBookingsDto.resourceId, 'resourceId');
        const serviceId = this.bookingRulesService.parsePositiveInteger(createFixedBookingsDto.serviceId, 'serviceId');
        const startAt = this.bookingRulesService.parseInstant(createFixedBookingsDto.startAt, 'startAt');
        const source = this.resolveCreateSource(createFixedBookingsDto.source);
        const providedCustomerId = this.parseCreateCustomerId(createFixedBookingsDto.customerId);
        const periodMonths = this.validateFixedBookingPeriodMonths(createFixedBookingsDto.periodMonths);
        const reservationName = this.validateRequiredString(createFixedBookingsDto.reservationName, 'reservationName', 150);
        this.validateCreateCustomerInput(providedCustomerId, source, reservationName, createFixedBookingsDto.customerPhone);
        const resourcePreferences = {
            isIndoor: this.bookingRulesService.parseOptionalBoolean(createFixedBookingsDto.resourceIsIndoor, 'resourceIsIndoor'),
        };
        await this.assertProvidedCustomerBelongsToBusiness(providedCustomerId, businessId);
        const business = await this.bookingRulesService.getBusinessOrFail(businessId);
        const startsAt = this.buildWeeklyFixedBookingStarts(startAt, periodMonths, business.timezone);
        const occurrences = [];
        for (const occurrenceStartAt of startsAt) {
            const context = await this.bookingRulesService.validateBookingContext(businessId, branchId, serviceId, resourceId, occurrenceStartAt, resourcePreferences, allowedResourceIds);
            this.bookingRulesService.assertInstantIsNowOrFuture(occurrenceStartAt, 'startAt');
            const occurrenceEndAt = new Date(occurrenceStartAt.getTime() + context.service.duration_minutes * 60_000);
            const occurrence = {
                startAt: occurrenceStartAt,
                endAt: occurrenceEndAt,
                context,
            };
            this.assertNoFixedBookingBatchOverlap(occurrences, occurrence);
            occurrences.push(occurrence);
        }
        if (occurrences.length === 0) {
            throw new common_1.BadRequestException('No fixed bookings were generated');
        }
        const customerId = await this.resolveCreateCustomerId(providedCustomerId, source, reservationName, createFixedBookingsDto.customerPhone);
        try {
            const bookings = await this.databaseService.withTransaction(async (client) => {
                await this.customersService.addToBusiness(customerId, businessId, client);
                const localStart = this.getLocalDateTimeParts(startAt, business.timezone);
                const recurringBooking = await this.recurringBookingsService.createRecord({
                    businessId,
                    branchId,
                    resourceId: occurrences[0].context.resource.id,
                    serviceId,
                    customerId,
                    dayOfWeek: this.toRecurringBookingDayOfWeek(localStart.date),
                    startTime: this.formatLocalTime(localStart.time),
                    startDate: this.formatLocalDate(localStart.date),
                    endDate: this.formatLocalDate(this.addMonths(localStart.date, periodMonths)),
                    status: 'ACTIVE',
                }, client);
                const createdBookings = [];
                for (const occurrence of occurrences) {
                    const { booking, reminder } = await this.insertConfirmedBooking({
                        businessId,
                        branchId,
                        resourceId: occurrence.context.resource.id,
                        customerId,
                        serviceId,
                        startAt: occurrence.startAt,
                        endAt: occurrence.endAt,
                        source,
                        totalPrice: Number(occurrence.context.service.price),
                        reservationName,
                        notes: null,
                        recurringBookingId: recurringBooking.id,
                    }, client);
                    createdBookings.push(this.mapCreatedBookingResponse({
                        booking,
                        reminder,
                        businessId,
                        branchId,
                        context: occurrence.context,
                        customerId,
                        startAt: occurrence.startAt,
                        endAt: occurrence.endAt,
                    }));
                }
                return {
                    recurringBooking,
                    bookings: createdBookings,
                };
            });
            for (const booking of bookings.bookings) {
                this.bookingsEventsService.emitChange({
                    type: 'created',
                    businessId,
                    bookingId: booking.id,
                });
            }
            return {
                businessId,
                branchId,
                serviceId,
                customerId,
                source,
                reservationName,
                periodMonths,
                recurringBookingId: bookings.recurringBooking.id,
                occurrenceCount: bookings.bookings.length,
                bookings: bookings.bookings,
            };
        }
        catch (error) {
            if (this.isBookingOverlapDatabaseError(error)) {
                throw new common_1.ConflictException('One or more fixed booking slots are no longer available');
            }
            throw error;
        }
    }
    async createFixedForBusiness(createFixedBookingsDto, currentUser, businessIdValue) {
        const access = await this.resolveBookingAccess(currentUser, businessIdValue);
        this.assertRequestBusinessMatches(createFixedBookingsDto.businessId, access.businessId);
        this.assertCanAccessBookingBranch(access, createFixedBookingsDto.branchId);
        return this.createFixed({
            ...createFixedBookingsDto,
            businessId: access.businessId,
        }, access.allowedResourceIds);
    }
    async findUpcomingForCustomer(input) {
        const businessId = this.bookingRulesService.parsePositiveInteger(input.businessId, 'businessId');
        const customerId = this.bookingRulesService.parsePositiveInteger(input.customerId, 'customerId');
        const branchId = this.bookingRulesService.parseOptionalPositiveInteger(input.branchId, 'branchId');
        const limit = this.bookingRulesService.parseOptionalPositiveInteger(input.limit, 'limit') ?? 5;
        if (limit > 10) {
            throw new common_1.BadRequestException('limit must be less than or equal to 10');
        }
        const business = await this.bookingRulesService.getBusinessOrFail(businessId);
        await this.bookingRulesService.validateCustomer(customerId);
        const date = input.date === undefined || input.date === null || input.date === ''
            ? null
            : this.bookingRulesService.parseRequiredDate(input.date, 'date');
        const dateRange = date ? this.getDateRange(date, business.timezone) : null;
        const rows = await this.bookingsRepository.findUpcomingDetailedForCustomer({
            businessId,
            customerId,
            branchId: branchId ?? undefined,
            now: input.now ?? new Date(),
            from: dateRange?.start,
            to: dateRange?.end,
            limit,
        });
        return rows.map((row) => this.mapDetailedBooking(row, business.timezone));
    }
    async resolveCustomerCancellation(input) {
        const bookings = await this.findUpcomingForCustomer({
            businessId: input.businessId,
            customerId: input.customerId,
            branchId: input.branchId,
            date: input.date,
            limit: input.limit,
            now: input.now,
        });
        if (bookings.length === 0) {
            return {
                action: 'NO_ACTIVE_BOOKINGS',
                bookings,
            };
        }
        const selectedBookingId = this.bookingRulesService.parseOptionalPositiveInteger(input.selectedBookingId, 'selectedBookingId');
        if (selectedBookingId) {
            const selectedBooking = bookings.find((booking) => booking.id === selectedBookingId);
            if (selectedBooking) {
                return {
                    action: 'CANCELLED',
                    booking: await this.cancelActiveForCustomer({
                        bookingId: selectedBooking.id,
                        businessId: input.businessId,
                        customerId: input.customerId,
                    }),
                    bookings,
                };
            }
        }
        const candidateBookings = this.findCancellationCandidatesFromMessage(input.messageText, bookings);
        const explicitCancellation = this.isExplicitCancellationRequest(input.messageText);
        const suggestiveCancellation = this.isSuggestiveCancellationRequest(input.messageText);
        const relevantBookings = candidateBookings.length > 0 ? candidateBookings : bookings;
        if (relevantBookings.length === 1) {
            const booking = relevantBookings[0];
            if (explicitCancellation) {
                return {
                    action: 'CANCELLED',
                    booking: await this.cancelActiveForCustomer({
                        bookingId: booking.id,
                        businessId: input.businessId,
                        customerId: input.customerId,
                    }),
                    bookings,
                };
            }
            if (suggestiveCancellation || candidateBookings.length === 1) {
                return {
                    action: 'CONFIRM_CANCELLATION',
                    booking,
                    bookings,
                };
            }
        }
        return {
            action: 'SELECT_BOOKING',
            bookings: relevantBookings,
        };
    }
    async findAll(query) {
        const resolvedQuery = await this.resolveFindAllQuery(query);
        return this.findAllResolved(resolvedQuery);
    }
    async findAllForBusiness(query, currentUser) {
        const access = await this.resolveBookingAccess(currentUser, query.businessId);
        const resolvedQuery = await this.resolveFindAllQuery({
            ...query,
            businessId: String(access.businessId),
        });
        return this.findAllResolved(this.applyBookingAccessToQuery(resolvedQuery, access));
    }
    streamAll(query) {
        return this.streamAllWithAccess(query);
    }
    streamAllForBusiness(query, currentUser) {
        return (0, rxjs_1.defer)(() => (0, rxjs_1.from)(this.resolveBookingAccess(currentUser, query.businessId))).pipe((0, rxjs_1.switchMap)((access) => this.streamAllWithAccess({
            ...query,
            businessId: String(access.businessId),
        }, access)));
    }
    streamAllWithAccess(query, access) {
        return (0, rxjs_1.defer)(() => (0, rxjs_1.from)(this.resolveFindAllQuery(query).then((resolvedQuery) => access
            ? this.applyBookingAccessToQuery(resolvedQuery, access)
            : resolvedQuery))).pipe((0, rxjs_1.switchMap)((resolvedQuery) => (0, rxjs_1.merge)((0, rxjs_1.from)(this.findAllResolved(resolvedQuery)).pipe((0, rxjs_1.map)((response) => ({
            event: 'snapshot',
            data: response.data,
            emittedAt: new Date().toISOString(),
        }))), this.bookingsEventsService
            .watchBusiness(resolvedQuery.businessId)
            .pipe((0, rxjs_1.switchMap)((change) => (0, rxjs_1.from)(this.findAllResolved(resolvedQuery)).pipe((0, rxjs_1.map)((response) => ({
            event: 'bookings.changed',
            data: response.data,
            change,
            emittedAt: new Date().toISOString(),
        }))))), (0, rxjs_1.interval)(25_000).pipe((0, rxjs_1.map)(() => ({
            event: 'ping',
            emittedAt: new Date().toISOString(),
        }))))));
    }
    async resolveFindAllQuery(query) {
        const businessId = this.bookingRulesService.parsePositiveInteger(query.businessId, 'businessId');
        const business = await this.bookingRulesService.getBusinessOrFail(businessId);
        const fromDate = this.bookingRulesService.parseRequiredDate(query.from, 'from');
        const toDate = this.bookingRulesService.parseRequiredDate(query.to, 'to');
        const rangeStart = this.getLocalDateStart(fromDate, business.timezone);
        const rangeEnd = this.getNextLocalDateStart(toDate, business.timezone);
        if (rangeEnd <= rangeStart) {
            throw new common_1.BadRequestException('to must be greater than or equal to from');
        }
        const page = this.bookingRulesService.parseOptionalPositiveInteger(query.page, 'page') ?? 1;
        const limit = this.bookingRulesService.parseOptionalPositiveInteger(query.limit, 'limit') ?? 50;
        if (limit > 100) {
            throw new common_1.BadRequestException('limit must be less than or equal to 100');
        }
        const status = this.validateOptionalStatus(query.status);
        return {
            businessId,
            from: rangeStart,
            to: rangeEnd,
            timezone: business.timezone,
            branchId: this.bookingRulesService.parseOptionalPositiveInteger(query.branchId, 'branchId'),
            resourceId: this.bookingRulesService.parseOptionalPositiveInteger(query.resourceId, 'resourceId'),
            serviceId: this.bookingRulesService.parseOptionalPositiveInteger(query.serviceId, 'serviceId'),
            customerId: this.bookingRulesService.parseOptionalPositiveInteger(query.customerId, 'customerId'),
            status,
            page,
            limit,
        };
    }
    async findAllResolved(query) {
        const rows = await this.bookingsRepository.findDetailed(query);
        return {
            data: rows.map((row) => this.mapDetailedBooking(row, query.timezone)),
        };
    }
    async findOne(id, businessIdValue) {
        const bookingId = this.bookingRulesService.parsePositiveInteger(id, 'id');
        const businessId = this.bookingRulesService.parsePositiveInteger(businessIdValue, 'businessId');
        const business = await this.bookingRulesService.getBusinessOrFail(businessId);
        const row = await this.bookingsRepository.findDetailedById(bookingId, businessId);
        if (!row) {
            throw new common_1.NotFoundException('Booking not found');
        }
        return this.mapDetailedBooking(row, business.timezone);
    }
    async findOneForBusiness(id, currentUser, businessIdValue) {
        const access = await this.resolveBookingAccess(currentUser, businessIdValue);
        return this.findOneScoped(id, access);
    }
    async findOneScoped(id, access) {
        const bookingId = this.bookingRulesService.parsePositiveInteger(id, 'id');
        const business = await this.bookingRulesService.getBusinessOrFail(access.businessId);
        const row = await this.bookingsRepository.findDetailedById(bookingId, access.businessId, access.allowedBranchIds, access.allowedResourceIds);
        if (!row) {
            throw new common_1.NotFoundException('Booking not found');
        }
        return this.mapDetailedBooking(row, business.timezone);
    }
    async update(id, businessIdValue, updateBookingDto, allowedBranchIds, allowedResourceIds) {
        const bookingId = this.bookingRulesService.parsePositiveInteger(id, 'id');
        const businessId = this.bookingRulesService.parsePositiveInteger(businessIdValue, 'businessId');
        const dto = { ...updateBookingDto };
        if (dto.status !== undefined) {
            dto.status = this.validateOptionalStatus(dto.status);
            if (dto.status === 'CANCELLED' && dto.cancelled_at === undefined) {
                dto.cancelled_at = new Date();
            }
        }
        if (dto.confirmation_status !== undefined) {
            dto.confirmation_status = this.validateConfirmationStatus(dto.confirmation_status);
        }
        if (dto.source !== undefined) {
            dto.source = this.validateSource(dto.source);
        }
        if (dto.reservation_name !== undefined) {
            dto.reservation_name = this.validateNullableString(dto.reservation_name, 'reservation_name');
        }
        if (dto.start_at !== undefined) {
            dto.start_at = this.bookingRulesService.parseInstant(dto.start_at, 'start_at');
            this.bookingRulesService.assertInstantIsNowOrFuture(dto.start_at, 'start_at');
        }
        if (dto.end_at !== undefined) {
            dto.end_at = this.bookingRulesService.parseInstant(dto.end_at, 'end_at');
        }
        if (dto.reconfirmed_at !== undefined && dto.reconfirmed_at !== null) {
            dto.reconfirmed_at = this.bookingRulesService.parseInstant(dto.reconfirmed_at, 'reconfirmed_at');
        }
        if (dto.cancelled_at !== undefined && dto.cancelled_at !== null) {
            dto.cancelled_at = this.bookingRulesService.parseInstant(dto.cancelled_at, 'cancelled_at');
        }
        if (dto.start_at !== undefined &&
            dto.end_at !== undefined &&
            dto.end_at <= dto.start_at) {
            throw new common_1.BadRequestException('end_at must be after start_at');
        }
        await this.assertBookingUpdateContextBelongsToBusiness(bookingId, businessId, dto, allowedBranchIds, allowedResourceIds);
        const updated = await this.bookingsRepository.update(bookingId, businessId, dto, allowedBranchIds, allowedResourceIds);
        if (!updated) {
            throw new common_1.NotFoundException('Booking not found');
        }
        this.bookingsEventsService.emitChange({
            type: updated.status === 'CANCELLED' ? 'cancelled' : 'updated',
            businessId,
            bookingId: updated.id,
        });
        return updated;
    }
    async updateForBusiness(id, updateBookingDto, currentUser, businessIdValue) {
        const access = await this.resolveBookingAccess(currentUser, businessIdValue);
        this.assertRequestBusinessMatches(updateBookingDto.businessId, access.businessId);
        this.assertRequestBusinessMatches(updateBookingDto.business_id, access.businessId);
        if (updateBookingDto.branch_id !== undefined) {
            this.assertCanAccessBookingBranch(access, updateBookingDto.branch_id, 'branch_id');
        }
        return this.update(id, access.businessId, updateBookingDto, access.allowedBranchIds, access.allowedResourceIds);
    }
    async remove(id, businessIdValue) {
        const businessId = this.bookingRulesService.parsePositiveInteger(businessIdValue, 'businessId');
        const removed = await this.bookingsRepository.remove(id, businessId);
        if (removed) {
            this.bookingsEventsService.emitChange({
                type: 'deleted',
                businessId,
                bookingId: id,
            });
        }
        return removed;
    }
    async removeForBusiness(id, currentUser, businessIdValue) {
        const bookingId = this.bookingRulesService.parsePositiveInteger(id, 'id');
        const access = await this.resolveBookingAccess(currentUser, businessIdValue);
        const removed = await this.bookingsRepository.remove(bookingId, access.businessId, access.allowedBranchIds, access.allowedResourceIds);
        if (!removed) {
            throw new common_1.NotFoundException('Booking not found');
        }
        this.bookingsEventsService.emitChange({
            type: 'deleted',
            businessId: access.businessId,
            bookingId,
        });
        return { deleted: true };
    }
    async reconfirm(id, businessIdValue) {
        const bookingId = this.bookingRulesService.parsePositiveInteger(id, 'id');
        const businessId = this.bookingRulesService.parsePositiveInteger(businessIdValue, 'businessId');
        const updated = await this.bookingsRepository.markReconfirmed(bookingId, businessId);
        if (!updated) {
            throw new common_1.NotFoundException('Pending booking confirmation not found');
        }
        this.bookingsEventsService.emitChange({
            type: 'reconfirmed',
            businessId,
            bookingId,
        });
        return updated;
    }
    async reconfirmForBusiness(id, currentUser, businessIdValue) {
        const access = await this.resolveBookingAccess(currentUser, businessIdValue);
        return this.reconfirmScoped(id, access);
    }
    async reconfirmScoped(id, access) {
        const bookingId = this.bookingRulesService.parsePositiveInteger(id, 'id');
        const updated = await this.bookingsRepository.markReconfirmed(bookingId, access.businessId, access.allowedBranchIds, access.allowedResourceIds);
        if (!updated) {
            throw new common_1.NotFoundException('Pending booking confirmation not found');
        }
        this.bookingsEventsService.emitChange({
            type: 'reconfirmed',
            businessId: access.businessId,
            bookingId,
        });
        return updated;
    }
    async cancelFromReminder(id, businessIdValue) {
        const bookingId = this.bookingRulesService.parsePositiveInteger(id, 'id');
        const businessId = this.bookingRulesService.parsePositiveInteger(businessIdValue, 'businessId');
        const updated = await this.bookingsRepository.cancelForBusiness(bookingId, businessId);
        if (!updated) {
            throw new common_1.NotFoundException('Booking not found');
        }
        this.bookingsEventsService.emitChange({
            type: 'cancelled',
            businessId,
            bookingId,
        });
        return updated;
    }
    async cancelFromReminderForBusiness(id, currentUser, businessIdValue) {
        const access = await this.resolveBookingAccess(currentUser, businessIdValue);
        return this.cancelFromReminderScoped(id, access);
    }
    async cancelFromReminderScoped(id, access) {
        const bookingId = this.bookingRulesService.parsePositiveInteger(id, 'id');
        const updated = await this.bookingsRepository.cancelForBusiness(bookingId, access.businessId, access.allowedBranchIds, access.allowedResourceIds);
        if (!updated) {
            throw new common_1.NotFoundException('Booking not found');
        }
        this.bookingsEventsService.emitChange({
            type: 'cancelled',
            businessId: access.businessId,
            bookingId,
        });
        return updated;
    }
    async cancelActiveForCustomer(input) {
        const bookingId = this.bookingRulesService.parsePositiveInteger(input.bookingId, 'bookingId');
        const businessId = this.bookingRulesService.parsePositiveInteger(input.businessId, 'businessId');
        const customerId = this.bookingRulesService.parsePositiveInteger(input.customerId, 'customerId');
        const business = await this.bookingRulesService.getBusinessOrFail(businessId);
        const updated = await this.bookingsRepository.cancelForBusinessAndCustomer(bookingId, businessId, customerId);
        if (!updated) {
            throw new common_1.NotFoundException('Active customer booking not found');
        }
        await this.remindersRepository.cancelPendingForBooking(bookingId, businessId, 'Booking cancelled by customer');
        const row = await this.bookingsRepository.findDetailedById(bookingId, businessId);
        if (!row) {
            throw new common_1.NotFoundException('Booking not found');
        }
        const response = this.mapDetailedBooking(row, business.timezone);
        this.bookingsEventsService.emitChange({
            type: 'cancelled',
            businessId,
            bookingId,
        });
        return response;
    }
    async resolveBookingAccess(currentUser, businessIdValue) {
        const authorization = currentUser.authorization;
        if (!authorization) {
            throw new common_1.ForbiddenException('Authorization context is required');
        }
        if (authorization.isSuperadmin) {
            return {
                businessId: this.bookingRulesService.parsePositiveInteger(businessIdValue, 'businessId'),
                accessScope: 'business',
            };
        }
        const accessScope = authorization.permissions['booking.manage'];
        if (!accessScope) {
            throw new common_1.ForbiddenException('Missing permission booking.manage');
        }
        const businessId = this.requireBusinessUserBusinessId(authorization.businessId);
        if (businessIdValue !== undefined) {
            const requestedBusinessId = this.bookingRulesService.parsePositiveInteger(businessIdValue, 'businessId');
            if (requestedBusinessId !== businessId) {
                throw new common_1.ForbiddenException('Cannot access another business');
            }
        }
        const allowedBranchIds = accessScope === 'business' ? undefined : authorization.branchIds;
        const allowedResourceIds = accessScope === 'own'
            ? await this.findAssignedResourceIds(authorization.userId, businessId, allowedBranchIds)
            : undefined;
        return {
            businessId,
            accessScope,
            allowedBranchIds,
            allowedResourceIds,
        };
    }
    requireBusinessUserBusinessId(businessId) {
        if (businessId === undefined || businessId === null || businessId === '') {
            throw new common_1.ForbiddenException('User must belong to a business');
        }
        return this.bookingRulesService.parsePositiveInteger(businessId, 'businessId');
    }
    applyBookingAccessToQuery(query, access) {
        if (query.resourceId !== undefined) {
            this.assertCanAccessBookingResource(query.resourceId, access.allowedResourceIds);
        }
        if (access.allowedBranchIds === undefined) {
            return {
                ...query,
                allowedResourceIds: access.allowedResourceIds,
            };
        }
        if (query.branchId !== undefined) {
            this.assertCanAccessBookingBranch(access, query.branchId);
            return {
                ...query,
                allowedResourceIds: access.allowedResourceIds,
            };
        }
        return {
            ...query,
            allowedBranchIds: access.allowedBranchIds,
            allowedResourceIds: access.allowedResourceIds,
        };
    }
    assertCanAccessBookingBranch(access, branchIdValue, field = 'branchId') {
        const branchId = this.bookingRulesService.parsePositiveInteger(branchIdValue, field);
        if (access.allowedBranchIds === undefined) {
            return branchId;
        }
        if (!access.allowedBranchIds.includes(branchId)) {
            throw new common_1.ForbiddenException('Branch is not assigned to user');
        }
        return branchId;
    }
    assertCanAccessBookingResource(resourceIdValue, allowedResourceIds, field = 'resourceId') {
        const resourceId = this.bookingRulesService.parsePositiveInteger(resourceIdValue, field);
        if (allowedResourceIds === undefined) {
            return resourceId;
        }
        if (!allowedResourceIds.includes(resourceId)) {
            throw new common_1.ForbiddenException('Resource is not assigned to user');
        }
        return resourceId;
    }
    async findAssignedResourceIds(userId, businessId, allowedBranchIds) {
        const values = [userId, businessId];
        const branchCondition = this.buildAllowedBranchCondition('r.branch_id', values, allowedBranchIds);
        const result = await this.databaseService.query(`
        SELECT r.id
        FROM user_resource ur
        INNER JOIN resource r ON r.id = ur.resource_id
        INNER JOIN branch b ON b.id = r.branch_id
        WHERE ur.user_id = $1
          AND b.business_id = $2
          ${branchCondition}
      `, values);
        return result.rows.map((row) => Number(row.id));
    }
    buildAllowedBranchCondition(branchIdExpression, values, allowedBranchIds) {
        if (allowedBranchIds === undefined) {
            return '';
        }
        if (allowedBranchIds.length === 0) {
            return 'AND FALSE';
        }
        values.push(allowedBranchIds);
        return `AND ${branchIdExpression} = ANY($${values.length}::bigint[])`;
    }
    assertRequestBusinessMatches(businessIdValue, businessId) {
        if (businessIdValue === undefined ||
            businessIdValue === null ||
            businessIdValue === '') {
            return;
        }
        const requestedBusinessId = this.bookingRulesService.parsePositiveInteger(businessIdValue, 'businessId');
        if (requestedBusinessId !== businessId) {
            throw new common_1.ForbiddenException('Cannot access another business');
        }
    }
    async assertProvidedCustomerBelongsToBusiness(customerId, businessId) {
        if (customerId === undefined || customerId === null) {
            return;
        }
        const belongs = await this.bookingsRepository.customerBelongsToBusiness(customerId, businessId);
        if (!belongs) {
            throw new common_1.ForbiddenException('Customer does not belong to business');
        }
    }
    async assertBookingUpdateContextBelongsToBusiness(bookingId, businessId, updateBookingDto, allowedBranchIds, allowedResourceIds) {
        const contextFields = [
            'branch_id',
            'resource_id',
            'customer_id',
            'service_id',
        ];
        const hasContextUpdate = contextFields.some((field) => Object.prototype.hasOwnProperty.call(updateBookingDto, field));
        if (!hasContextUpdate) {
            return;
        }
        const current = await this.bookingsRepository.findByIdForBusiness(bookingId, businessId, allowedBranchIds, allowedResourceIds);
        if (!current) {
            throw new common_1.NotFoundException('Booking not found');
        }
        const branchId = updateBookingDto.branch_id === undefined
            ? current.branch_id
            : this.bookingRulesService.parsePositiveInteger(updateBookingDto.branch_id, 'branch_id');
        const resourceId = updateBookingDto.resource_id === undefined
            ? current.resource_id
            : this.bookingRulesService.parsePositiveInteger(updateBookingDto.resource_id, 'resource_id');
        this.assertCanAccessBookingResource(resourceId, allowedResourceIds);
        const serviceId = updateBookingDto.service_id === undefined
            ? current.service_id
            : this.bookingRulesService.parsePositiveInteger(updateBookingDto.service_id, 'service_id');
        const customerId = updateBookingDto.customer_id === undefined
            ? current.customer_id
            : updateBookingDto.customer_id === null
                ? null
                : this.bookingRulesService.parsePositiveInteger(updateBookingDto.customer_id, 'customer_id');
        const belongs = await this.bookingsRepository.bookingContextBelongsToBusiness({
            businessId,
            branchId,
            resourceId,
            serviceId,
            customerId,
        });
        if (!belongs) {
            throw new common_1.ForbiddenException('Booking context does not belong to business');
        }
    }
    validateSource(source) {
        if (typeof source !== 'string') {
            throw new common_1.BadRequestException('source must be WEB, WHATSAPP or ADMIN');
        }
        if (!booking_constants_1.BOOKING_SOURCES.includes(source)) {
            throw new common_1.BadRequestException('source must be WEB, WHATSAPP or ADMIN');
        }
        return source;
    }
    validateOptionalStatus(status) {
        if (!status) {
            return undefined;
        }
        if (typeof status !== 'string') {
            throw new common_1.BadRequestException('status is invalid');
        }
        if (!booking_constants_1.BOOKING_STATUSES.includes(status)) {
            throw new common_1.BadRequestException('status is invalid');
        }
        return status;
    }
    validateConfirmationStatus(confirmationStatus) {
        if (typeof confirmationStatus !== 'string') {
            throw new common_1.BadRequestException('confirmation_status must be NOT_REQUIRED, PENDING or RECONFIRMED');
        }
        const normalized = confirmationStatus.toLowerCase();
        if (!booking_constants_1.BOOKING_CONFIRMATION_STATUSES.includes(normalized)) {
            throw new common_1.BadRequestException('confirmation_status must be NOT_REQUIRED, PENDING or RECONFIRMED');
        }
        return normalized;
    }
    validateNotes(notes) {
        return this.validateNullableString(notes, 'notes');
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
    getLocalDateStart(date, timeZone) {
        return this.getDateRange(date, timeZone).start;
    }
    getNextLocalDateStart(date, timeZone) {
        return this.getDateRange(date, timeZone).end;
    }
    getDateRange(date, timeZone) {
        return (0, timezone_1.localDateRangeToUtc)(date, timeZone);
    }
    getInitialConfirmationStatus(startAt) {
        return startAt.getTime() - Date.now() >= RECONFIRMATION_REQUIRED_AFTER_MS
            ? 'pending'
            : 'not_required';
    }
    toApiConfirmationStatus(confirmationStatus) {
        return confirmationStatus.toUpperCase();
    }
    findCancellationCandidatesFromMessage(messageText, bookings) {
        const requestedTime = this.extractRequestedTime(messageText);
        if (!requestedTime) {
            return [];
        }
        return bookings.filter((booking) => this.formatBookingTime(booking.startAt) === requestedTime);
    }
    isExplicitCancellationRequest(messageText) {
        const normalizedText = this.normalizeHumanText(messageText);
        return /\b(cancelar|cancela|cancelame|anular|anula|dar de baja|dalo de baja|baja|borrar)\b/.test(normalizedText);
    }
    isSuggestiveCancellationRequest(messageText) {
        const normalizedText = this.normalizeHumanText(messageText);
        return /\b(no voy a poder ir|no puedo ir|al final no puedo|no puedo|no llego|no voy a ir|no puedo asistir|no voy a asistir)\b/.test(normalizedText);
    }
    extractRequestedTime(messageText) {
        const normalizedText = this.normalizeHumanText(messageText);
        const match = /\b(?:de las|a las|las|tipo)?\s*([01]?\d|2[0-3])(?:(?::|\.)([0-5]\d)|\s*h?s?)\b/.exec(normalizedText);
        if (!match) {
            return null;
        }
        return `${String(Number(match[1])).padStart(2, '0')}:${match[2] ?? '00'}`;
    }
    formatBookingTime(startAt) {
        return startAt.slice(11, 16);
    }
    normalizeHumanText(value) {
        return value
            .toLowerCase()
            .replace(/&(?:#x20|#32|nbsp);/g, ' ')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    mapDetailedBooking(row, timeZone) {
        const startAt = row.start_at instanceof Date ? row.start_at : new Date(row.start_at);
        const endAt = row.end_at instanceof Date ? row.end_at : new Date(row.end_at);
        return {
            id: row.id,
            startAt: this.bookingRulesService.formatInstant(startAt, timeZone),
            endAt: this.bookingRulesService.formatInstant(endAt, timeZone),
            status: row.status,
            confirmationStatus: this.toApiConfirmationStatus(row.confirmation_status),
            reconfirmedAt: row.reconfirmed_at,
            cancelledAt: row.cancelled_at,
            source: row.source,
            totalPrice: Number(row.total_price),
            reservationName: row.reservation_name,
            notes: row.notes,
            recurringBookingId: row.recurring_booking_id,
            branch: {
                id: row.branch_id,
                name: row.branch_name,
            },
            resource: {
                id: row.resource_id,
                name: row.resource_name,
                priority: row.resource_priority,
                isIndoor: row.resource_is_indoor,
            },
            service: {
                id: row.service_id,
                name: row.service_name,
            },
            customer: row.customer_id === null
                ? null
                : {
                    id: row.customer_id,
                    name: row.customer_name ?? '',
                    phone: row.customer_phone ?? '',
                    ...(row.customer_no_show_count === undefined
                        ? {}
                        : { noShowCount: Number(row.customer_no_show_count) }),
                    ...(row.customer_completed_count === undefined ||
                        row.customer_completed_last_window_count === undefined
                        ? {}
                        : {
                            customerType: this.resolveCustomerFrequencyType(Number(row.customer_completed_count), Number(row.customer_completed_last_window_count)),
                        }),
                },
        };
    }
    resolveCustomerFrequencyType(completedCount, completedLastWindowCount) {
        if (completedCount <= 1) {
            return 'new';
        }
        if (completedLastWindowCount >= booking_constants_1.FREQUENT_CUSTOMER_MIN_BOOKINGS) {
            return 'frequent';
        }
        return 'casual';
    }
    resolveCreateSource(source) {
        if (source === undefined || source === null || source === '') {
            return 'ADMIN';
        }
        return this.validateSource(source);
    }
    parseCreateCustomerId(customerIdValue) {
        return this.bookingRulesService.parseOptionalPositiveInteger(customerIdValue, 'customerId');
    }
    validateCreateCustomerInput(customerId, source, reservationName, customerPhone) {
        if (customerId !== undefined) {
            return;
        }
        if (source !== 'ADMIN') {
            throw new common_1.BadRequestException('customerId is required');
        }
        this.validateRequiredString(reservationName, 'reservationName', 150);
        this.validateRequiredString(customerPhone, 'customerPhone', 30);
    }
    async resolveCreateCustomerId(customerId, source, reservationName, customerPhone) {
        if (customerId !== undefined) {
            await this.bookingRulesService.validateCustomer(customerId);
            return customerId;
        }
        if (source !== 'ADMIN') {
            throw new common_1.BadRequestException('customerId is required');
        }
        const customer = await this.customersService.getOrCreateByPhone({
            name: this.validateRequiredString(reservationName, 'reservationName', 150),
            phone: this.validateRequiredString(customerPhone, 'customerPhone', 30),
        });
        return customer.id;
    }
    validateRequiredString(value, fieldName, maxLength) {
        if (typeof value !== 'string') {
            throw new common_1.BadRequestException(`${fieldName} must be a non-empty string`);
        }
        const trimmed = value.trim();
        if (trimmed.length === 0) {
            throw new common_1.BadRequestException(`${fieldName} must be a non-empty string`);
        }
        if (maxLength !== undefined && trimmed.length > maxLength) {
            throw new common_1.BadRequestException(`${fieldName} must be ${maxLength} characters or less`);
        }
        return trimmed;
    }
    validateFixedBookingPeriodMonths(value) {
        const periodMonths = Number(value);
        if (!FIXED_BOOKING_PERIOD_MONTHS.includes(periodMonths)) {
            throw new common_1.BadRequestException('periodMonths must be 3, 6 or 12');
        }
        return periodMonths;
    }
    buildWeeklyFixedBookingStarts(firstStartAt, periodMonths, timeZone) {
        const localStart = this.getLocalDateTimeParts(firstStartAt, timeZone);
        const endDate = this.addMonths(localStart.date, periodMonths);
        const startsAt = [];
        let date = localStart.date;
        while (this.compareLocalDates(date, endDate) < 0) {
            startsAt.push((0, timezone_1.zonedDateTimeToUtc)(date, localStart.time, timeZone));
            date = (0, timezone_1.addDays)(date, 7);
        }
        return startsAt;
    }
    getLocalDateTimeParts(instant, timeZone) {
        const formatted = this.bookingRulesService.formatInstant(instant, timeZone);
        const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(formatted);
        if (!match) {
            throw new common_1.BadRequestException('startAt must be a valid ISO datetime');
        }
        return {
            date: {
                year: Number(match[1]),
                month: Number(match[2]),
                day: Number(match[3]),
            },
            time: {
                hour: Number(match[4]),
                minute: Number(match[5]),
                second: Number(match[6]),
            },
        };
    }
    addMonths(date, amount) {
        const monthIndex = date.month - 1 + amount;
        const year = date.year + Math.floor(monthIndex / 12);
        const month = (monthIndex % 12) + 1;
        const day = Math.min(date.day, this.getDaysInMonth(year, month));
        return { year, month, day };
    }
    getDaysInMonth(year, month) {
        return new Date(Date.UTC(year, month, 0)).getUTCDate();
    }
    compareLocalDates(left, right) {
        if (left.year !== right.year) {
            return left.year - right.year;
        }
        if (left.month !== right.month) {
            return left.month - right.month;
        }
        return left.day - right.day;
    }
    formatLocalDate(date) {
        return [
            String(date.year).padStart(4, '0'),
            String(date.month).padStart(2, '0'),
            String(date.day).padStart(2, '0'),
        ].join('-');
    }
    formatLocalTime(time) {
        return [
            String(time.hour).padStart(2, '0'),
            String(time.minute).padStart(2, '0'),
            String(time.second).padStart(2, '0'),
        ].join(':');
    }
    toRecurringBookingDayOfWeek(date) {
        return (((0, timezone_1.getDayOfWeek)(date) + 6) % 7) + 1;
    }
    assertNoFixedBookingBatchOverlap(existing, candidate) {
        const hasOverlap = existing.some((occurrence) => occurrence.context.resource.id === candidate.context.resource.id &&
            candidate.startAt < occurrence.endAt &&
            candidate.endAt > occurrence.startAt);
        if (hasOverlap) {
            throw new common_1.ConflictException('Generated fixed bookings overlap each other');
        }
    }
    async insertConfirmedBooking(record, executor) {
        const createdBooking = await this.bookingsRepository.create({
            businessId: record.businessId,
            branchId: record.branchId,
            resourceId: record.resourceId,
            customerId: record.customerId,
            serviceId: record.serviceId,
            startAt: record.startAt,
            endAt: record.endAt,
            status: 'CONFIRMED',
            confirmationStatus: this.getInitialConfirmationStatus(record.startAt),
            source: record.source,
            totalPrice: record.totalPrice,
            reservationName: record.reservationName,
            notes: record.notes,
            recurringBookingId: record.recurringBookingId ?? null,
        }, executor);
        const bookingWithConfirmationStatus = await this.bookingsRepository.updateInitialConfirmationStatus(createdBooking.id, RECONFIRMATION_REQUIRED_AFTER_MS, executor);
        const reminderScheduledAt = bookingWithConfirmationStatus.confirmation_status === 'pending'
            ? new Date(record.startAt.getTime() - RECONFIRMATION_REMINDER_OFFSET_MS)
            : null;
        const createdReminder = reminderScheduledAt
            ? await this.remindersRepository.createReconfirmationIfRequired({
                bookingId: createdBooking.id,
                channel: RECONFIRMATION_REMINDER_CHANNEL,
                messageType: RECONFIRMATION_REMINDER_MESSAGE_TYPE,
                scheduledAt: reminderScheduledAt,
                status: 'pending',
            }, RECONFIRMATION_REQUIRED_AFTER_MS, executor)
            : null;
        return {
            booking: bookingWithConfirmationStatus,
            reminder: createdReminder,
        };
    }
    mapCreatedBookingResponse(input) {
        return {
            id: input.booking.id,
            businessId: input.businessId,
            branchId: input.branchId,
            resource: {
                id: input.context.resource.id,
                name: input.context.resource.name,
                priority: input.context.resource.priority,
                isIndoor: input.context.resource.is_indoor,
            },
            service: {
                id: input.context.service.id,
                name: input.context.service.name,
            },
            customerId: input.customerId,
            startAt: this.bookingRulesService.formatInstant(input.startAt, input.context.business.timezone),
            endAt: this.bookingRulesService.formatInstant(input.endAt, input.context.business.timezone),
            status: input.booking.status,
            confirmationStatus: this.toApiConfirmationStatus(input.booking.confirmation_status),
            reconfirmedAt: input.booking.reconfirmed_at,
            cancelledAt: input.booking.cancelled_at,
            source: input.booking.source,
            totalPrice: Number(input.booking.total_price),
            reservationName: input.booking.reservation_name,
            notes: input.booking.notes,
            recurringBookingId: input.booking.recurring_booking_id,
            reminder: input.reminder
                ? {
                    id: input.reminder.id,
                    channel: input.reminder.channel,
                    messageType: input.reminder.message_type,
                    scheduledAt: this.bookingRulesService.formatInstant(input.reminder.scheduled_at, input.context.business.timezone),
                    validUntil: this.bookingRulesService.formatInstant(new Date(input.reminder.scheduled_at.getTime() +
                        RECONFIRMATION_REMINDER_VALIDITY_MS), input.context.business.timezone),
                    status: input.reminder.status,
                }
                : null,
        };
    }
    isBookingOverlapDatabaseError(error) {
        if (!error || typeof error !== 'object') {
            return false;
        }
        const code = error.code;
        return code === '23P01';
    }
    logCreateBookingError(error, context) {
        this.logger.error(JSON.stringify({
            event: 'booking.create.failed',
            occurredAt: new Date().toISOString(),
            context: {
                ...context,
                startAt: context.startAt.toISOString(),
                endAt: context.endAt?.toISOString() ?? null,
                confirmationStatus: context.confirmationStatus ?? null,
            },
            error: this.serializeError(error),
        }));
    }
    serializeError(error) {
        if (error instanceof Error) {
            return {
                name: error.name,
                message: error.message,
                stack: error.stack ?? null,
                code: this.getErrorStringProperty(error, 'code'),
                detail: this.getErrorStringProperty(error, 'detail'),
                constraint: this.getErrorStringProperty(error, 'constraint'),
            };
        }
        return {
            name: null,
            message: String(error),
            stack: null,
        };
    }
    getErrorStringProperty(error, property) {
        const value = error[property];
        return typeof value === 'string' ? value : undefined;
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = BookingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bookings_repository_1.BookingsRepository,
        booking_rules_service_1.BookingRulesService,
        reminders_repository_1.RemindersRepository,
        database_service_1.DatabaseService,
        bookings_events_service_1.BookingsEventsService,
        customers_service_1.CustomersService,
        recurring_bookings_service_1.RecurringBookingsService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map