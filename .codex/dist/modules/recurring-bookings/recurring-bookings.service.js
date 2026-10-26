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
exports.RecurringBookingsService = void 0;
const common_1 = require("@nestjs/common");
const timezone_1 = require("../../common/utils/timezone");
const phone_1 = require("../../common/utils/phone");
const database_service_1 = require("../../database/database.service");
const recurring_bookings_repository_1 = require("./recurring-bookings.repository");
const RECURRING_BOOKING_STATUSES = ['ACTIVE', 'PAUSED', 'CANCELLED'];
let RecurringBookingsService = class RecurringBookingsService {
    recurringBookingsRepository;
    databaseService;
    constructor(recurringBookingsRepository, databaseService) {
        this.recurringBookingsRepository = recurringBookingsRepository;
        this.databaseService = databaseService;
    }
    async create(businessIdValue, createRecurringBookingDto) {
        const businessId = this.parsePositiveInteger(businessIdValue, 'businessId');
        const record = this.toCreateRecord(businessId, createRecurringBookingDto);
        await this.assertBusinessExists(record.businessId);
        await this.assertContextBelongsToBusiness(record);
        return this.recurringBookingsRepository.create(record);
    }
    async createForBusiness(createRecurringBookingDto, currentUser, businessIdValue) {
        const access = this.resolveRecurringBookingAccess(currentUser, businessIdValue);
        const record = this.toCreateRecord(access.businessId, createRecurringBookingDto);
        this.assertBranchAllowed(record.branchId, access.filter);
        await this.assertBusinessExists(record.businessId);
        await this.assertContextBelongsToBusiness(record);
        return this.recurringBookingsRepository.create(record);
    }
    async findAll(businessIdValue, searchValue, pageValue, limitValue, accessFilter) {
        const businessId = this.parsePositiveInteger(businessIdValue, 'businessId');
        const search = this.parseSearch(searchValue);
        const pagination = this.parsePagination(pageValue, limitValue, 100, 20);
        const rows = await this.recurringBookingsRepository.findAllForBusiness(businessId, search.textPattern, search.phonePatterns, pagination.limit, pagination.offset, accessFilter);
        const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
        return {
            data: rows.map((row) => this.mapSummary(row)),
            pagination: this.buildPagination(pagination.page, pagination.limit, total),
        };
    }
    findAllForBusiness(currentUser, businessIdValue, searchValue, pageValue, limitValue) {
        const access = this.resolveRecurringBookingAccess(currentUser, businessIdValue);
        return this.findAll(access.businessId, searchValue, pageValue, limitValue, access.filter);
    }
    async findOne(idValue, businessIdValue, accessFilter) {
        const id = this.parsePositiveInteger(idValue, 'id');
        const businessId = this.parsePositiveInteger(businessIdValue, 'businessId');
        const recurringBooking = await this.recurringBookingsRepository.findDetailForBusiness(id, businessId, accessFilter);
        if (!recurringBooking) {
            throw new common_1.NotFoundException('Recurring booking not found for business');
        }
        return this.mapDetail(recurringBooking);
    }
    findOneForBusiness(idValue, currentUser, businessIdValue) {
        const access = this.resolveRecurringBookingAccess(currentUser, businessIdValue);
        return this.findOne(idValue, access.businessId, access.filter);
    }
    async update(idValue, businessIdValue, updateRecurringBookingDto, accessFilter) {
        const id = this.parsePositiveInteger(idValue, 'id');
        const businessId = this.parsePositiveInteger(businessIdValue, 'businessId');
        const current = await this.recurringBookingsRepository.findDetailForBusiness(id, businessId, accessFilter);
        if (!current) {
            throw new common_1.NotFoundException('Recurring booking not found for business');
        }
        const update = this.normalizeUpdateDto(updateRecurringBookingDto);
        const merged = {
            businessId,
            branchId: update.branch_id ??
                this.parsePositiveInteger(current.branch_id, 'branch_id'),
            resourceId: update.resource_id ??
                this.parsePositiveInteger(current.resource_id, 'resource_id'),
            serviceId: update.service_id ??
                this.parsePositiveInteger(current.service_id, 'service_id'),
            customerId: update.customer_id ??
                this.parsePositiveInteger(current.customer_id, 'customer_id'),
            dayOfWeek: update.day_of_week ??
                this.parseDayOfWeek(current.day_of_week),
            startTime: update.start_time ?? this.formatTimeWithSeconds(current.start_time),
            startDate: update.start_date ?? this.formatDate(current.start_date),
            endDate: update.end_date ?? this.formatDate(current.end_date),
            status: update.status ?? current.status,
            serviceDurationMinutes: 0,
            timeZone: current.business_timezone,
        };
        this.assertDateRange(merged.startDate, merged.endDate);
        this.assertBranchAllowed(merged.branchId, accessFilter);
        await this.assertContextBelongsToBusiness(merged);
        merged.serviceDurationMinutes = await this.getServiceDurationOrFail(merged.serviceId, merged.branchId, businessId);
        try {
            await this.databaseService.withTransaction(async (client) => {
                const updated = await this.recurringBookingsRepository.update(id, businessId, update, accessFilter, client);
                if (!updated) {
                    throw new common_1.NotFoundException('Recurring booking not found for business');
                }
                if (merged.status === 'CANCELLED') {
                    await this.recurringBookingsRepository.cancelActiveBookingsForRecurring(id, businessId, accessFilter, client);
                    return;
                }
                if (this.shouldPropagateToActiveBookings(update)) {
                    await this.updateActiveBookingOccurrences(id, merged, update, client);
                }
            });
        }
        catch (error) {
            if (this.isBookingOverlapDatabaseError(error)) {
                throw new common_1.ConflictException('One or more recurring booking slots are no longer available');
            }
            throw error;
        }
        const detail = await this.recurringBookingsRepository.findDetailForBusiness(id, businessId, accessFilter);
        if (!detail) {
            throw new common_1.NotFoundException('Recurring booking not found for business');
        }
        return this.mapDetail(detail);
    }
    updateForBusiness(idValue, updateRecurringBookingDto, currentUser, businessIdValue) {
        const access = this.resolveRecurringBookingAccess(currentUser, businessIdValue);
        return this.update(idValue, access.businessId, updateRecurringBookingDto, access.filter);
    }
    async remove(idValue, businessIdValue, accessFilter) {
        const id = this.parsePositiveInteger(idValue, 'id');
        const businessId = this.parsePositiveInteger(businessIdValue, 'businessId');
        const removed = await this.recurringBookingsRepository.remove(id, businessId, accessFilter);
        if (!removed) {
            throw new common_1.NotFoundException('Recurring booking not found for business');
        }
        return { deleted: true };
    }
    removeForBusiness(idValue, currentUser, businessIdValue) {
        const access = this.resolveRecurringBookingAccess(currentUser, businessIdValue);
        return this.remove(idValue, access.businessId, access.filter);
    }
    async createRecord(record, executor) {
        await this.assertContextBelongsToBusiness(record, executor);
        return this.recurringBookingsRepository.create(record, executor);
    }
    toCreateRecord(businessId, createRecurringBookingDto) {
        const startDate = this.parseDateOnly(createRecurringBookingDto.start_date, 'start_date');
        const endDate = this.parseDateOnly(createRecurringBookingDto.end_date, 'end_date');
        this.assertDateRange(startDate, endDate);
        return {
            businessId,
            branchId: this.parsePositiveInteger(createRecurringBookingDto.branch_id, 'branch_id'),
            resourceId: this.parsePositiveInteger(createRecurringBookingDto.resource_id, 'resource_id'),
            serviceId: this.parsePositiveInteger(createRecurringBookingDto.service_id, 'service_id'),
            customerId: this.parsePositiveInteger(createRecurringBookingDto.customer_id, 'customer_id'),
            dayOfWeek: this.parseDayOfWeek(createRecurringBookingDto.day_of_week),
            startTime: this.parseTime(createRecurringBookingDto.start_time, 'start_time'),
            startDate,
            endDate,
            status: this.parseOptionalStatus(createRecurringBookingDto.status),
        };
    }
    normalizeUpdateDto(updateRecurringBookingDto) {
        const allowedFields = [
            'branch_id',
            'resource_id',
            'service_id',
            'customer_id',
            'day_of_week',
            'start_time',
            'start_date',
            'end_date',
            'status',
        ];
        const unsupportedFields = Object.keys(updateRecurringBookingDto).filter((field) => !allowedFields.includes(field));
        if (unsupportedFields.length > 0) {
            throw new common_1.BadRequestException(`${unsupportedFields.join(', ')} cannot be updated`);
        }
        const update = {};
        if (updateRecurringBookingDto.branch_id !== undefined) {
            update.branch_id = this.parsePositiveInteger(updateRecurringBookingDto.branch_id, 'branch_id');
        }
        if (updateRecurringBookingDto.resource_id !== undefined) {
            update.resource_id = this.parsePositiveInteger(updateRecurringBookingDto.resource_id, 'resource_id');
        }
        if (updateRecurringBookingDto.service_id !== undefined) {
            update.service_id = this.parsePositiveInteger(updateRecurringBookingDto.service_id, 'service_id');
        }
        if (updateRecurringBookingDto.customer_id !== undefined) {
            update.customer_id = this.parsePositiveInteger(updateRecurringBookingDto.customer_id, 'customer_id');
        }
        if (updateRecurringBookingDto.day_of_week !== undefined) {
            update.day_of_week = this.parseDayOfWeek(updateRecurringBookingDto.day_of_week);
        }
        if (updateRecurringBookingDto.start_time !== undefined) {
            update.start_time = this.parseTime(updateRecurringBookingDto.start_time, 'start_time');
        }
        if (updateRecurringBookingDto.start_date !== undefined) {
            update.start_date = this.parseDateOnly(updateRecurringBookingDto.start_date, 'start_date');
        }
        if (updateRecurringBookingDto.end_date !== undefined) {
            update.end_date = this.parseDateOnly(updateRecurringBookingDto.end_date, 'end_date');
        }
        if (update.start_date !== undefined && update.end_date !== undefined) {
            this.assertDateRange(update.start_date, update.end_date);
        }
        if (updateRecurringBookingDto.status !== undefined) {
            update.status = this.parseOptionalStatus(updateRecurringBookingDto.status);
        }
        return update;
    }
    parsePositiveInteger(value, field) {
        const numberValue = Number(value);
        if (value === undefined ||
            value === null ||
            value === '' ||
            !Number.isInteger(numberValue) ||
            numberValue <= 0) {
            throw new common_1.BadRequestException(`${field} must be a positive integer`);
        }
        return numberValue;
    }
    resolveRecurringBookingAccess(currentUser, businessIdValue) {
        const authorization = currentUser.authorization;
        if (!authorization) {
            throw new common_1.ForbiddenException('Authorization context is required');
        }
        if (authorization.isSuperadmin) {
            return {
                businessId: this.parsePositiveInteger(businessIdValue, 'businessId'),
                accessScope: 'business',
            };
        }
        const accessScope = authorization.permissions['booking.manage'];
        if (!accessScope) {
            throw new common_1.ForbiddenException('Missing permission booking.manage');
        }
        const businessId = this.requireBusinessUserBusinessId(authorization.businessId);
        if (businessIdValue !== undefined) {
            const requestedBusinessId = this.parsePositiveInteger(businessIdValue, 'businessId');
            if (requestedBusinessId !== businessId) {
                throw new common_1.ForbiddenException('Cannot access another business');
            }
        }
        return {
            businessId,
            accessScope,
            filter: accessScope === 'business'
                ? undefined
                : { allowedBranchIds: authorization.branchIds },
        };
    }
    requireBusinessUserBusinessId(businessId) {
        if (businessId === undefined || businessId === null || businessId === '') {
            throw new common_1.ForbiddenException('User must belong to a business');
        }
        return this.parsePositiveInteger(businessId, 'businessId');
    }
    assertBranchAllowed(branchId, accessFilter) {
        if (accessFilter?.allowedBranchIds === undefined) {
            return;
        }
        if (!accessFilter.allowedBranchIds.includes(branchId)) {
            throw new common_1.ForbiddenException('Branch is not assigned to user');
        }
    }
    parseDayOfWeek(value) {
        const dayOfWeek = this.parsePositiveInteger(value, 'day_of_week');
        if (dayOfWeek < 1 || dayOfWeek > 7) {
            throw new common_1.BadRequestException('day_of_week must be between 1 and 7');
        }
        return dayOfWeek;
    }
    parseDateOnly(value, field) {
        if (typeof value !== 'string' || !(0, timezone_1.parseDateOnly)(value)) {
            throw new common_1.BadRequestException(`${field} must be a valid YYYY-MM-DD date`);
        }
        return value;
    }
    parseTime(value, field) {
        if (typeof value !== 'string') {
            throw new common_1.BadRequestException(`${field} must be a valid HH:mm:ss time`);
        }
        const parsed = (0, timezone_1.parseTime)(value);
        if (!parsed) {
            throw new common_1.BadRequestException(`${field} must be a valid HH:mm:ss time`);
        }
        return [
            String(parsed.hour).padStart(2, '0'),
            String(parsed.minute).padStart(2, '0'),
            String(parsed.second).padStart(2, '0'),
        ].join(':');
    }
    parseOptionalStatus(value) {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        if (typeof value !== 'string' ||
            !RECURRING_BOOKING_STATUSES.includes(value)) {
            throw new common_1.BadRequestException('status must be ACTIVE, PAUSED or CANCELLED');
        }
        return value;
    }
    shouldPropagateToActiveBookings(updateRecurringBookingDto) {
        return [
            'branch_id',
            'resource_id',
            'service_id',
            'customer_id',
            'day_of_week',
            'start_time',
            'start_date',
            'end_date',
        ].some((field) => Object.prototype.hasOwnProperty.call(updateRecurringBookingDto, field));
    }
    async updateActiveBookingOccurrences(recurringBookingId, pattern, updateRecurringBookingDto, executor) {
        const activeBookings = await this.recurringBookingsRepository.findActiveBookingsForRecurring(recurringBookingId, pattern.businessId, executor);
        const startsAt = this.buildTargetStarts(pattern, activeBookings, updateRecurringBookingDto);
        for (const booking of activeBookings.slice(startsAt.length)) {
            await this.recurringBookingsRepository.cancelActiveBookingOccurrence({
                bookingId: booking.id,
                businessId: pattern.businessId,
                recurringBookingId,
            }, executor);
        }
        const updateIndexes = startsAt.map((_, index) => index);
        if (this.shouldUpdateDescending(activeBookings, startsAt)) {
            updateIndexes.reverse();
        }
        for (const index of updateIndexes) {
            const booking = activeBookings[index];
            const startAt = startsAt[index];
            await this.recurringBookingsRepository.updateActiveBookingOccurrence({
                bookingId: booking.id,
                businessId: pattern.businessId,
                recurringBookingId,
                branchId: pattern.branchId,
                resourceId: pattern.resourceId,
                customerId: pattern.customerId,
                serviceId: pattern.serviceId,
                startAt,
                endAt: new Date(startAt.getTime() + pattern.serviceDurationMinutes * 60_000),
            }, executor);
        }
    }
    shouldUpdateDescending(activeBookings, startsAt) {
        if (activeBookings.length === 0 || startsAt.length === 0) {
            return false;
        }
        return (startsAt[0].getTime() > this.toDate(activeBookings[0].start_at).getTime());
    }
    buildTargetStarts(pattern, activeBookings, updateRecurringBookingDto) {
        if (!this.hasScheduleChange(updateRecurringBookingDto)) {
            return activeBookings.map((booking) => this.toDate(booking.start_at));
        }
        if (this.hasOnlyStartTimeChange(updateRecurringBookingDto)) {
            const startTime = this.parseLocalTime(pattern.startTime);
            return activeBookings.map((booking) => (0, timezone_1.zonedDateTimeToUtc)((0, timezone_1.getLocalDateFromInstant)(this.toDate(booking.start_at), pattern.timeZone), startTime, pattern.timeZone));
        }
        return this.buildRecurringStarts(pattern, activeBookings);
    }
    buildRecurringStarts(pattern, activeBookings) {
        const startDate = this.parseLocalDate(pattern.startDate);
        const endDate = this.parseLocalDate(pattern.endDate);
        const startTime = this.parseLocalTime(pattern.startTime);
        const startsAt = [];
        const firstActiveDate = activeBookings.length === 0
            ? startDate
            : (0, timezone_1.getLocalDateFromInstant)(this.toDate(activeBookings[0].start_at), pattern.timeZone);
        let date = this.nextDateOnOrAfter(this.maxLocalDate(startDate, firstActiveDate), pattern.dayOfWeek);
        while (startsAt.length < activeBookings.length &&
            this.compareLocalDates(date, endDate) <= 0) {
            startsAt.push((0, timezone_1.zonedDateTimeToUtc)(date, startTime, pattern.timeZone));
            date = (0, timezone_1.addDays)(date, 7);
        }
        return startsAt;
    }
    hasScheduleChange(updateRecurringBookingDto) {
        return ['day_of_week', 'start_time', 'start_date', 'end_date'].some((field) => Object.prototype.hasOwnProperty.call(updateRecurringBookingDto, field));
    }
    hasOnlyStartTimeChange(updateRecurringBookingDto) {
        return (Object.prototype.hasOwnProperty.call(updateRecurringBookingDto, 'start_time') &&
            !['day_of_week', 'start_date', 'end_date'].some((field) => Object.prototype.hasOwnProperty.call(updateRecurringBookingDto, field)));
    }
    nextDateOnOrAfter(date, recurringDayOfWeek) {
        const currentDay = this.toRecurringDayOfWeek(date);
        const daysToAdd = (recurringDayOfWeek - currentDay + 7) % 7;
        return (0, timezone_1.addDays)(date, daysToAdd);
    }
    toRecurringDayOfWeek(date) {
        return (((0, timezone_1.getDayOfWeek)(date) + 6) % 7) + 1;
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
    maxLocalDate(left, right) {
        return this.compareLocalDates(left, right) >= 0 ? left : right;
    }
    parseLocalDate(value) {
        const date = (0, timezone_1.parseDateOnly)(value);
        if (!date) {
            throw new common_1.BadRequestException('date must be a valid YYYY-MM-DD date');
        }
        return date;
    }
    parseLocalTime(value) {
        const time = (0, timezone_1.parseTime)(value);
        if (!time) {
            throw new common_1.BadRequestException('time must be a valid HH:mm:ss time');
        }
        return time;
    }
    parseSearch(searchValue) {
        if (searchValue === undefined || searchValue === null) {
            return {
                textPattern: null,
                phonePatterns: [''],
            };
        }
        if (typeof searchValue !== 'string') {
            throw new common_1.BadRequestException('search must be a string');
        }
        const search = searchValue.trim();
        if (!search) {
            return {
                textPattern: null,
                phonePatterns: [''],
            };
        }
        const phonePatterns = (0, phone_1.buildPhoneLookupCandidates)(search).map((candidate) => this.toLikePattern(candidate));
        return {
            textPattern: this.toLikePattern(search),
            phonePatterns: phonePatterns.length > 0 ? phonePatterns : [''],
        };
    }
    parsePagination(pageValue, limitValue, maxLimit, defaultLimit) {
        const page = pageValue === undefined || pageValue === null || pageValue === ''
            ? 1
            : this.parsePositiveInteger(pageValue, 'page');
        const limit = limitValue === undefined || limitValue === null || limitValue === ''
            ? defaultLimit
            : this.parsePositiveInteger(limitValue, 'limit');
        if (limit > maxLimit) {
            throw new common_1.BadRequestException(`limit must be less than or equal to ${maxLimit}`);
        }
        return {
            page,
            limit,
            offset: (page - 1) * limit,
        };
    }
    buildPagination(page, limit, total) {
        return {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        };
    }
    toLikePattern(value) {
        return `%${value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
    }
    mapSummary(row) {
        return {
            id: row.id,
            status: row.status,
            customer: this.mapCustomer(row),
            service: this.mapService(row),
            resource: this.mapResource(row),
            schedule: this.mapSchedule(row),
            next_booking_at: this.formatNullableInstant(row.next_booking_at, row.business_timezone),
        };
    }
    mapDetail(row) {
        return {
            id: row.id,
            status: row.status,
            customer: this.mapCustomer(row),
            service: this.mapService(row),
            resource: this.mapResource(row),
            schedule: this.mapSchedule(row),
            stats: {
                total: Number(row.total_count),
                attended: Number(row.attended_count),
                pending: Number(row.pending_count),
                no_show: Number(row.no_show_count),
                cancelled: Number(row.cancelled_count),
            },
            next_booking_at: this.formatNullableInstant(row.next_booking_at, row.business_timezone),
        };
    }
    mapCustomer(row) {
        return {
            id: row.customer_id,
            name: row.customer_name,
            phone: row.customer_phone,
        };
    }
    mapService(row) {
        return {
            id: row.service_id,
            name: row.service_name,
        };
    }
    mapResource(row) {
        return {
            id: row.resource_id,
            name: row.resource_name,
        };
    }
    mapSchedule(row) {
        return {
            day_of_week: row.day_of_week,
            start_time: this.formatTime(row.start_time),
            start_date: this.formatDate(row.start_date),
            end_date: this.formatDate(row.end_date),
        };
    }
    formatNullableInstant(value, timeZone) {
        if (value === null) {
            return null;
        }
        return (0, timezone_1.formatInTimeZone)(this.toDate(value), timeZone);
    }
    toDate(value) {
        return value instanceof Date ? value : new Date(value);
    }
    formatTime(value) {
        return value.slice(0, 5);
    }
    formatTimeWithSeconds(value) {
        const time = (0, timezone_1.parseTime)(value);
        if (!time) {
            return value;
        }
        return [
            String(time.hour).padStart(2, '0'),
            String(time.minute).padStart(2, '0'),
            String(time.second).padStart(2, '0'),
        ].join(':');
    }
    formatDate(value) {
        if (value instanceof Date) {
            return value.toISOString().slice(0, 10);
        }
        return value.slice(0, 10);
    }
    assertDateRange(startDate, endDate) {
        if (startDate > endDate) {
            throw new common_1.BadRequestException('start_date must be before or equal to end_date');
        }
    }
    toDateOnlyString(value) {
        if (value instanceof Date) {
            return value.toISOString().slice(0, 10);
        }
        return value.slice(0, 10);
    }
    async assertBusinessExists(businessId) {
        const exists = await this.recurringBookingsRepository.businessExists(businessId);
        if (!exists) {
            throw new common_1.NotFoundException('Business not found');
        }
    }
    async assertContextBelongsToBusiness(record, executor) {
        const belongs = await this.recurringBookingsRepository.contextBelongsToBusiness(record, executor);
        if (!belongs) {
            throw new common_1.BadRequestException('branch, resource, service and customer must belong to business');
        }
    }
    async getServiceDurationOrFail(serviceId, branchId, businessId) {
        const duration = await this.recurringBookingsRepository.findServiceDurationForBusiness(serviceId, branchId, businessId);
        if (duration === null || duration <= 0) {
            throw new common_1.BadRequestException('Service duration must be positive');
        }
        return duration;
    }
    isBookingOverlapDatabaseError(error) {
        if (!error || typeof error !== 'object') {
            return false;
        }
        const code = error.code;
        return code === '23P01';
    }
};
exports.RecurringBookingsService = RecurringBookingsService;
exports.RecurringBookingsService = RecurringBookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [recurring_bookings_repository_1.RecurringBookingsRepository,
        database_service_1.DatabaseService])
], RecurringBookingsService);
//# sourceMappingURL=recurring-bookings.service.js.map