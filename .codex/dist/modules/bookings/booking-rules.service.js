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
exports.BookingRulesService = void 0;
const common_1 = require("@nestjs/common");
const timezone_1 = require("../../common/utils/timezone");
const booking_rules_repository_1 = require("./booking-rules.repository");
let BookingRulesService = class BookingRulesService {
    bookingRulesRepository;
    constructor(bookingRulesRepository) {
        this.bookingRulesRepository = bookingRulesRepository;
    }
    async getAvailability(query, allowedResourceIds) {
        const businessId = this.parsePositiveInteger(query.businessId, 'businessId');
        const branchId = this.parsePositiveInteger(query.branchId, 'branchId');
        const serviceId = this.parsePositiveInteger(query.serviceId, 'serviceId');
        const resourceId = this.parseOptionalPositiveInteger(query.resourceId, 'resourceId');
        const resourcePreferences = {
            isIndoor: this.parseOptionalBoolean(query.resourceIsIndoor, 'resourceIsIndoor'),
        };
        const date = this.parseRequiredDate(query.date, 'date');
        const context = await this.validateBusinessBranchService(businessId, branchId, serviceId);
        this.assertDateIsTodayOrFuture(date, context.business.timezone, 'date');
        if (resourceId) {
            this.assertResourceAllowed(resourceId, allowedResourceIds);
            await this.validateResourceForService(resourceId, branchId, businessId, serviceId);
        }
        const resources = await this.bookingRulesRepository.findEligibleResources(businessId, branchId, serviceId, resourceId, resourcePreferences.isIndoor, allowedResourceIds);
        const resourceIds = resources.map((resource) => resource.id);
        const dayOfWeek = (0, timezone_1.getDayOfWeek)(date);
        const { start: dayStart, end: dayEnd } = (0, timezone_1.localDateRangeToUtc)(date, context.business.timezone);
        const [schedules, blocks, bookings] = await Promise.all([
            this.bookingRulesRepository.findSchedules(resourceIds, dayOfWeek),
            this.bookingRulesRepository.findBlocks(resourceIds, dayStart, dayEnd),
            this.bookingRulesRepository.findActiveBookings(resourceIds, dayStart, dayEnd),
        ]);
        const slots = this.buildAvailabilitySlots(resources, schedules, blocks, bookings, date, context.service.duration_minutes, context.business.timezone);
        return {
            date: query.date,
            service: this.mapService(context.service),
            slots,
        };
    }
    async getDayBounds(query, allowedResourceIds) {
        const businessId = this.parsePositiveInteger(query.businessId, 'businessId');
        const branchId = this.parsePositiveInteger(query.branchId, 'branchId');
        const resourceId = this.parseOptionalPositiveInteger(query.resourceId, 'resourceId');
        const date = this.parseRequiredDate(query.date, 'date');
        const business = await this.getBusinessOrFail(businessId);
        const branch = await this.bookingRulesRepository.findBranchForBusiness(branchId, businessId);
        if (!branch) {
            throw new common_1.NotFoundException('Branch not found for business');
        }
        if (resourceId) {
            this.assertResourceAllowed(resourceId, allowedResourceIds);
            const resource = await this.bookingRulesRepository.findResourceForBranch(resourceId, branchId, businessId);
            if (!resource) {
                throw new common_1.NotFoundException('Resource not found for branch');
            }
        }
        const dayOfWeek = (0, timezone_1.getDayOfWeek)(date);
        const { start: dayStart, end: dayEnd } = (0, timezone_1.localDateRangeToUtc)(date, business.timezone);
        const [schedules, blocks] = await Promise.all([
            this.bookingRulesRepository.findActiveSchedulesForBranchDay(businessId, branchId, dayOfWeek, resourceId, allowedResourceIds),
            this.bookingRulesRepository.findBlocksForBranchDay(businessId, branchId, dayStart, dayEnd, resourceId, allowedResourceIds),
        ]);
        const { earliestTime, latestTime } = this.getScheduleBoundsFromRows(schedules);
        return {
            date: query.date,
            businessId,
            branch,
            timezone: business.timezone,
            earliestTime,
            latestTime,
            hasBlocks: blocks.length > 0,
            blocks: blocks.map((block) => this.mapDayBoundsBlock(block, business.timezone)),
        };
    }
    async getBusinessOrFail(businessId) {
        const business = await this.bookingRulesRepository.findBusiness(businessId);
        if (!business) {
            throw new common_1.NotFoundException('Business not found');
        }
        if (!(0, timezone_1.isValidTimeZone)(business.timezone)) {
            throw new common_1.BadRequestException('Business timezone is invalid');
        }
        return business;
    }
    assertResourceAllowed(resourceId, allowedResourceIds) {
        if (allowedResourceIds === undefined) {
            return;
        }
        if (!allowedResourceIds.includes(resourceId)) {
            throw new common_1.NotFoundException('Resource not found for branch');
        }
    }
    async findSingleActiveBranchForBusiness(businessIdValue) {
        const businessId = this.parsePositiveInteger(businessIdValue, 'businessId');
        const branches = await this.bookingRulesRepository.findActiveBranchesForBusiness(businessId, 2);
        return branches.length === 1 ? branches[0] : null;
    }
    async validateBookingContext(businessId, branchId, serviceId, resourceId, startAt, resourcePreferences = {}, allowedResourceIds) {
        const context = await this.validateBusinessBranchService(businessId, branchId, serviceId);
        const endAt = new Date(startAt.getTime() + context.service.duration_minutes * 60_000);
        let resource;
        if (resourceId) {
            this.assertResourceAllowed(resourceId, allowedResourceIds);
            resource = await this.validateResourceForService(resourceId, branchId, businessId, serviceId);
            await this.assertResourceAvailable(resource.id, startAt, endAt, context.business.timezone);
        }
        else {
            if (context.service.resource_selection_mode === 'REQUIRED') {
                throw new common_1.BadRequestException('resourceId is required for the selected service');
            }
            resource = await this.selectAvailableResourceForBooking(businessId, branchId, serviceId, startAt, endAt, context.business.timezone, resourcePreferences, allowedResourceIds);
        }
        return {
            ...context,
            resource,
        };
    }
    async validateCustomer(customerId) {
        const customer = await this.bookingRulesRepository.findCustomer(customerId);
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
    }
    async findSingleActiveServiceForBranch(businessIdValue, branchIdValue) {
        const businessId = this.parsePositiveInteger(businessIdValue, 'businessId');
        const branchId = this.parsePositiveInteger(branchIdValue, 'branchId');
        const services = await this.bookingRulesRepository.findActiveServicesForBranch(businessId, branchId, 2);
        return services.length === 1 ? services[0] : null;
    }
    async findActiveServicesForBranch(businessIdValue, branchIdValue, limitValue = 10) {
        const businessId = this.parsePositiveInteger(businessIdValue, 'businessId');
        const branchId = this.parsePositiveInteger(branchIdValue, 'branchId');
        const limit = this.parsePositiveInteger(limitValue, 'limit');
        return this.bookingRulesRepository.findActiveServicesForBranch(businessId, branchId, Math.min(limit, 50));
    }
    async findActiveServiceForBranch(businessIdValue, branchIdValue, serviceIdValue) {
        const businessId = this.parsePositiveInteger(businessIdValue, 'businessId');
        const branchId = this.parsePositiveInteger(branchIdValue, 'branchId');
        const serviceId = this.parsePositiveInteger(serviceIdValue, 'serviceId');
        return this.bookingRulesRepository.findActiveServiceForBranch(serviceId, businessId, branchId);
    }
    async findActiveServiceResourceOptionsForBranch(businessIdValue, branchIdValue, limitValue = 7) {
        const businessId = this.parsePositiveInteger(businessIdValue, 'businessId');
        const branchId = this.parsePositiveInteger(branchIdValue, 'branchId');
        const limit = this.parsePositiveInteger(limitValue, 'limit');
        return this.bookingRulesRepository.findActiveServiceResourceOptionsForBranch(businessId, branchId, Math.min(limit, 50));
    }
    async findEligibleResourcesForService(businessIdValue, branchIdValue, serviceIdValue, resourcePreferences = {}) {
        const businessId = this.parsePositiveInteger(businessIdValue, 'businessId');
        const branchId = this.parsePositiveInteger(branchIdValue, 'branchId');
        const serviceId = this.parsePositiveInteger(serviceIdValue, 'serviceId');
        return this.bookingRulesRepository.findEligibleResources(businessId, branchId, serviceId, undefined, resourcePreferences.isIndoor);
    }
    async findActiveResourceForService(businessIdValue, branchIdValue, serviceIdValue, resourceIdValue) {
        const businessId = this.parsePositiveInteger(businessIdValue, 'businessId');
        const branchId = this.parsePositiveInteger(branchIdValue, 'branchId');
        const serviceId = this.parsePositiveInteger(serviceIdValue, 'serviceId');
        const resourceId = this.parsePositiveInteger(resourceIdValue, 'resourceId');
        return this.bookingRulesRepository.findActiveResourceForService(resourceId, businessId, branchId, serviceId);
    }
    async assertResourceAvailable(resourceId, startAt, endAt, timeZone) {
        if (endAt <= startAt) {
            throw new common_1.BadRequestException('endAt must be after startAt');
        }
        const localDate = (0, timezone_1.getLocalDateFromInstant)(startAt, timeZone);
        const dayOfWeek = (0, timezone_1.getDayOfWeek)(localDate);
        const { start: dayStart, end: dayEnd } = (0, timezone_1.localDateRangeToUtc)(localDate, timeZone);
        const [schedules, blocks, bookings] = await Promise.all([
            this.bookingRulesRepository.findSchedules([resourceId], dayOfWeek),
            this.bookingRulesRepository.findBlocks([resourceId], dayStart, dayEnd),
            this.bookingRulesRepository.findActiveBookings([resourceId], dayStart, dayEnd),
        ]);
        if (!this.isInsideAnySchedule(startAt, endAt, schedules, localDate, timeZone)) {
            throw new common_1.BadRequestException('The selected time slot is outside the resource schedule');
        }
        if (this.overlapsAny(startAt, endAt, blocks)) {
            throw new common_1.BadRequestException('The selected time slot is blocked for this resource');
        }
        const conflictingBookings = this.findOverlappingBookings(startAt, endAt, bookings, timeZone);
        if (conflictingBookings.length > 0) {
            throw new common_1.ConflictException({
                message: 'The selected time slot is no longer available',
                error: 'Conflict',
                statusCode: 409,
                conflicts: conflictingBookings,
            });
        }
    }
    assertDateIsTodayOrFuture(date, timeZone, field) {
        const today = (0, timezone_1.getLocalDateFromInstant)(new Date(), timeZone);
        if (this.compareLocalDates(date, today) < 0) {
            throw new common_1.BadRequestException(`${field} must be today or a future date`);
        }
    }
    assertInstantIsNowOrFuture(date, field) {
        if (date.getTime() < Date.now()) {
            throw new common_1.BadRequestException(`${field} must be now or in the future`);
        }
    }
    parsePositiveInteger(value, field) {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new common_1.BadRequestException(`${field} must be a positive integer`);
        }
        return parsed;
    }
    parseOptionalPositiveInteger(value, field) {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        return this.parsePositiveInteger(value, field);
    }
    parseOptionalBoolean(value, field) {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        if (typeof value === 'boolean') {
            return value;
        }
        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            if (['true', '1', 'yes', 'si', 'sí'].includes(normalized)) {
                return true;
            }
            if (['false', '0', 'no'].includes(normalized)) {
                return false;
            }
        }
        throw new common_1.BadRequestException(`${field} must be a boolean`);
    }
    parseRequiredDate(value, field) {
        if (typeof value !== 'string') {
            throw new common_1.BadRequestException(`${field} must be a valid date`);
        }
        const parsed = (0, timezone_1.parseDateOnly)(value);
        if (!parsed) {
            throw new common_1.BadRequestException(`${field} must be a valid date in YYYY-MM-DD format`);
        }
        return parsed;
    }
    parseInstant(value, field) {
        if (value instanceof Date) {
            if (Number.isNaN(value.getTime())) {
                throw new common_1.BadRequestException(`${field} must be a valid ISO datetime`);
            }
            return value;
        }
        if (typeof value !== 'string') {
            throw new common_1.BadRequestException(`${field} must be a valid ISO datetime`);
        }
        if (!/^\d{4}-\d{2}-\d{2}T.+(Z|[+-]\d{2}:\d{2})$/.test(value)) {
            throw new common_1.BadRequestException(`${field} must include date, time and timezone offset`);
        }
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            throw new common_1.BadRequestException(`${field} must be a valid ISO datetime`);
        }
        return parsed;
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
    getScheduleBoundsFromRows(schedules) {
        let earliestMinutes = null;
        let latestMinutes = null;
        for (const schedule of schedules) {
            const startMinutes = this.parseScheduleMinutes(schedule.start_time);
            const endMinutes = this.parseScheduleMinutes(schedule.end_time);
            earliestMinutes =
                earliestMinutes === null
                    ? startMinutes
                    : Math.min(earliestMinutes, startMinutes);
            latestMinutes =
                latestMinutes === null
                    ? endMinutes
                    : Math.max(latestMinutes, endMinutes);
        }
        return {
            earliestTime: earliestMinutes === null ? null : this.formatMinutes(earliestMinutes),
            latestTime: latestMinutes === null ? null : this.formatMinutes(latestMinutes),
        };
    }
    parseScheduleMinutes(value) {
        const parsed = (0, timezone_1.parseTime)(value);
        if (!parsed) {
            throw new common_1.BadRequestException('Resource schedule time is invalid');
        }
        return parsed.hour * 60 + parsed.minute;
    }
    formatMinutes(minutes) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
    mapDayBoundsBlock(block, timeZone) {
        return {
            id: block.id,
            resource: {
                id: block.resource_id,
                name: block.resource_name,
            },
            startAt: (0, timezone_1.formatInTimeZone)(this.toDate(block.start_at), timeZone),
            endAt: (0, timezone_1.formatInTimeZone)(this.toDate(block.end_at), timeZone),
            reason: block.reason,
        };
    }
    formatInstant(date, timeZone) {
        return (0, timezone_1.formatInTimeZone)(date, timeZone);
    }
    async validateBusinessBranchService(businessId, branchId, serviceId) {
        const business = await this.getBusinessOrFail(businessId);
        const [branch, service] = await Promise.all([
            this.bookingRulesRepository.findBranchForBusiness(branchId, businessId),
            this.bookingRulesRepository.findServiceForBusiness(serviceId, businessId, branchId),
        ]);
        if (!branch) {
            throw new common_1.NotFoundException('Branch not found for business');
        }
        if (!service) {
            throw new common_1.NotFoundException('Service not found for business');
        }
        if (Number(service.duration_minutes) <= 0) {
            throw new common_1.BadRequestException('Service duration must be positive');
        }
        return {
            business,
            branch,
            service: {
                ...service,
                duration_minutes: Number(service.duration_minutes),
                price: Number(service.price),
            },
        };
    }
    async validateResourceForService(resourceId, branchId, businessId, serviceId) {
        const resource = await this.bookingRulesRepository.findResourceForBranch(resourceId, branchId, businessId);
        if (!resource) {
            throw new common_1.NotFoundException('Resource not found for branch');
        }
        const offersService = await this.bookingRulesRepository.resourceOffersService(resourceId, serviceId);
        if (!offersService) {
            throw new common_1.BadRequestException('Resource cannot provide the selected service');
        }
        return resource;
    }
    async selectAvailableResourceForBooking(businessId, branchId, serviceId, startAt, endAt, timeZone, resourcePreferences, allowedResourceIds) {
        const resources = await this.bookingRulesRepository.findEligibleResources(businessId, branchId, serviceId, undefined, resourcePreferences.isIndoor, allowedResourceIds);
        if (resources.length === 0) {
            throw new common_1.BadRequestException('No resources match the selected service and preferences');
        }
        const localDate = (0, timezone_1.getLocalDateFromInstant)(startAt, timeZone);
        const dayOfWeek = (0, timezone_1.getDayOfWeek)(localDate);
        const { start: dayStart, end: dayEnd } = (0, timezone_1.localDateRangeToUtc)(localDate, timeZone);
        const resourceIds = resources.map((resource) => resource.id);
        const [schedules, blocks, bookings] = await Promise.all([
            this.bookingRulesRepository.findSchedules(resourceIds, dayOfWeek),
            this.bookingRulesRepository.findBlocks(resourceIds, dayStart, dayEnd),
            this.bookingRulesRepository.findActiveBookings(resourceIds, dayStart, dayEnd),
        ]);
        const schedulesByResource = this.groupByResource(schedules);
        const blocksByResource = this.groupByResource(blocks);
        const bookingsByResource = this.groupByResource(bookings);
        const sortedResources = [...resources].sort((left, right) => {
            if (left.priority !== right.priority) {
                return left.priority - right.priority;
            }
            return left.name.localeCompare(right.name);
        });
        const selectedResource = sortedResources.find((resource) => {
            const resourceSchedules = schedulesByResource.get(resource.id) ?? [];
            return (this.isInsideAnySchedule(startAt, endAt, resourceSchedules, localDate, timeZone) &&
                !this.overlapsAny(startAt, endAt, blocksByResource.get(resource.id) ?? []) &&
                !this.overlapsAny(startAt, endAt, bookingsByResource.get(resource.id) ?? []));
        });
        if (!selectedResource) {
            throw new common_1.ConflictException('No available resource matches the selected service and preferences');
        }
        return selectedResource;
    }
    buildAvailabilitySlots(resources, schedules, blocks, bookings, date, durationMinutes, timeZone) {
        const schedulesByResource = this.groupByResource(schedules);
        const blocksByResource = this.groupByResource(blocks);
        const bookingsByResource = this.groupByResource(bookings);
        const durationMs = durationMinutes * 60_000;
        const slotIntervalMinutes = durationMinutes;
        const intervalMs = slotIntervalMinutes * 60_000;
        const slots = [];
        const now = new Date();
        for (const resource of resources) {
            const resourceSchedules = schedulesByResource.get(resource.id) ?? [];
            for (const schedule of resourceSchedules) {
                const scheduleRange = this.scheduleToUtcRange(schedule, date, timeZone);
                for (let slotStartMs = scheduleRange.start.getTime(); slotStartMs + durationMs <= scheduleRange.end.getTime(); slotStartMs += intervalMs) {
                    const slotStart = new Date(slotStartMs);
                    const slotEnd = new Date(slotStartMs + durationMs);
                    if (slotStart < now) {
                        continue;
                    }
                    if (this.overlapsAny(slotStart, slotEnd, blocksByResource.get(resource.id) ?? []) ||
                        this.overlapsAny(slotStart, slotEnd, bookingsByResource.get(resource.id) ?? [])) {
                        continue;
                    }
                    slots.push({
                        resourceId: resource.id,
                        resourceName: resource.name,
                        resourcePriority: resource.priority,
                        resourceIsIndoor: resource.is_indoor,
                        startAt: (0, timezone_1.formatInTimeZone)(slotStart, timeZone),
                        endAt: (0, timezone_1.formatInTimeZone)(slotEnd, timeZone),
                    });
                }
            }
        }
        return slots.sort((left, right) => {
            const startComparison = left.startAt.localeCompare(right.startAt);
            if (startComparison !== 0) {
                return startComparison;
            }
            if (left.resourcePriority !== right.resourcePriority) {
                return left.resourcePriority - right.resourcePriority;
            }
            return left.resourceName.localeCompare(right.resourceName);
        });
    }
    isInsideAnySchedule(startAt, endAt, schedules, date, timeZone) {
        return schedules.some((schedule) => {
            const range = this.scheduleToUtcRange(schedule, date, timeZone);
            return startAt >= range.start && endAt <= range.end;
        });
    }
    overlapsAny(startAt, endAt, ranges) {
        return ranges.some((range) => {
            const rangeStart = this.toDate(range.start_at);
            const rangeEnd = this.toDate(range.end_at);
            return startAt < rangeEnd && endAt > rangeStart;
        });
    }
    findOverlappingBookings(startAt, endAt, bookings, timeZone) {
        return bookings
            .filter((booking) => {
            const bookingStart = this.toDate(booking.start_at);
            const bookingEnd = this.toDate(booking.end_at);
            return startAt < bookingEnd && endAt > bookingStart;
        })
            .map((booking) => ({
            bookingId: Number(booking.booking_id),
            resourceId: Number(booking.resource_id),
            startAt: (0, timezone_1.formatInTimeZone)(this.toDate(booking.start_at), timeZone),
            endAt: (0, timezone_1.formatInTimeZone)(this.toDate(booking.end_at), timeZone),
        }));
    }
    scheduleToUtcRange(schedule, date, timeZone) {
        const startTime = (0, timezone_1.parseTime)(schedule.start_time);
        const endTime = (0, timezone_1.parseTime)(schedule.end_time);
        if (!startTime || !endTime) {
            throw new common_1.BadRequestException('Resource schedule time is invalid');
        }
        const start = (0, timezone_1.zonedDateTimeToUtc)(date, startTime, timeZone);
        let end = (0, timezone_1.zonedDateTimeToUtc)(date, endTime, timeZone);
        if (end <= start) {
            end = (0, timezone_1.zonedDateTimeToUtc)((0, timezone_1.addDays)(date, 1), endTime, timeZone);
        }
        return { start, end };
    }
    groupByResource(rows) {
        return rows.reduce((result, row) => {
            const grouped = result.get(row.resource_id) ?? [];
            grouped.push(row);
            result.set(row.resource_id, grouped);
            return result;
        }, new Map());
    }
    toDate(value) {
        return value instanceof Date ? value : new Date(value);
    }
    mapService(service) {
        return {
            id: service.id,
            name: service.name,
            durationMinutes: Number(service.duration_minutes),
            price: Number(service.price),
            resourceSelectionMode: service.resource_selection_mode,
            iconKey: service.icon_key,
            imageUrl: service.image_url,
        };
    }
};
exports.BookingRulesService = BookingRulesService;
exports.BookingRulesService = BookingRulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [booking_rules_repository_1.BookingRulesRepository])
], BookingRulesService);
//# sourceMappingURL=booking-rules.service.js.map