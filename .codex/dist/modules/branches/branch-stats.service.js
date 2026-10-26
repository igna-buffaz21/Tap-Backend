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
exports.BranchStatsService = void 0;
const common_1 = require("@nestjs/common");
const timezone_1 = require("../../common/utils/timezone");
const booking_constants_1 = require("../bookings/booking.constants");
const branches_repository_1 = require("./branches.repository");
const branch_stats_repository_1 = require("./branch-stats.repository");
const DAY_NAMES = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
];
const VALID_BOOKING_STATUSES = [
    ...booking_constants_1.ACTIVE_BOOKING_STATUSES,
    'COMPLETED',
    'NO_SHOW',
];
const ACCESS_SCOPE_WEIGHT = {
    own: 1,
    branch: 2,
    business: 3,
};
let BranchStatsService = class BranchStatsService {
    branchStatsRepository;
    branchesRepository;
    constructor(branchStatsRepository, branchesRepository) {
        this.branchStatsRepository = branchStatsRepository;
        this.branchesRepository = branchesRepository;
    }
    async getSummary(branchIdValue, query, currentUser) {
        const branchId = this.parsePositiveInteger(branchIdValue, 'branchId');
        const period = this.parsePeriod(query.period, [
            'day',
            'week',
            'month',
            'year',
        ]);
        const context = await this.getBranchContextOrFail(branchId, currentUser);
        const range = this.resolvePeriodRange(period, context.timezone);
        const rows = await this.loadCapacityRows(branchId, range, undefined, undefined, context.allowedResourceIds);
        const availableMinutes = this.calculateAvailableMinutes(this.enumerateDates(range.from, range.to), rows.schedules, rows.blocks, context.timezone);
        const validBookings = rows.bookings.filter((booking) => this.isValidBooking(booking));
        const periodBookings = rows.bookings.filter((booking) => this.startsInsideRange(booking, range.rangeStart, range.rangeEnd));
        const validPeriodBookings = periodBookings.filter((booking) => this.isValidBooking(booking));
        const cancellationsCount = periodBookings.filter((booking) => booking.status === 'CANCELLED').length;
        const reservedMinutes = validBookings.reduce((total, booking) => total +
            this.getOverlapMinutes(this.toDate(booking.start_at), this.toDate(booking.end_at), range.rangeStart, range.rangeEnd), 0);
        const estimatedRevenue = validPeriodBookings.reduce((total, booking) => total + Number(booking.service_price), 0);
        return {
            period,
            from: this.formatDate(range.from),
            to: this.formatDate(range.to),
            bookings: validPeriodBookings.length,
            estimatedRevenue,
            occupancyPercentage: this.percentage(reservedMinutes, availableMinutes),
            cancellations: {
                count: cancellationsCount,
                percentage: this.percentage(cancellationsCount, periodBookings.length),
            },
        };
    }
    async getDemand(branchIdValue, query, currentUser) {
        const branchId = this.parsePositiveInteger(branchIdValue, 'branchId');
        const period = this.parsePeriod(query.period, ['week', 'month', 'year']);
        const resourceId = this.parseOptionalPositiveInteger(query.resourceId, 'resourceId');
        const serviceId = this.parseOptionalPositiveInteger(query.serviceId, 'serviceId');
        const context = await this.getBranchContextOrFail(branchId, currentUser);
        const range = this.resolvePeriodRange(period, context.timezone);
        if (serviceId !== undefined &&
            !(await this.branchStatsRepository.serviceBelongsToBranch(serviceId, branchId))) {
            throw new common_1.NotFoundException('Service not found for branch');
        }
        const rows = await this.loadCapacityRows(branchId, range, resourceId, serviceId, context.allowedResourceIds);
        const cells = this.createHeatmapCells();
        const dates = this.enumerateDates(range.from, range.to);
        this.addAvailableMinutesToCells(cells, dates, rows.schedules, rows.blocks, context.timezone);
        this.addReservedMinutesToCells(cells, rows.bookings.filter((booking) => this.isValidBooking(booking)), range, context.timezone);
        const heatmap = DAY_NAMES.map((day, index) => {
            const dayOfWeek = index + 1;
            return {
                dayOfWeek,
                day,
                slots: this.hours().map((hour) => {
                    const cell = cells.get(this.cellKey(dayOfWeek, hour));
                    return {
                        hour,
                        reservedMinutes: cell.reservedMinutes,
                        availableMinutes: cell.availableMinutes,
                        occupancyPercentage: this.percentage(cell.reservedMinutes, cell.availableMinutes),
                    };
                }),
            };
        });
        const peak = this.findPeakCell(cells);
        return {
            period,
            from: this.formatDate(range.from),
            to: this.formatDate(range.to),
            resourceId: resourceId ?? null,
            serviceId: serviceId ?? null,
            heatmap,
            peak: peak
                ? {
                    dayOfWeek: peak.dayOfWeek,
                    day: peak.day,
                    hour: peak.hour,
                    occupancyPercentage: this.percentage(peak.reservedMinutes, peak.availableMinutes),
                }
                : null,
        };
    }
    async getBranchContextOrFail(branchId, currentUser) {
        const context = await this.branchStatsRepository.findBranchContext(branchId);
        if (!context) {
            throw new common_1.NotFoundException('Branch not found');
        }
        if (!(0, timezone_1.isValidTimeZone)(context.timezone)) {
            throw new common_1.BadRequestException('Business timezone is invalid');
        }
        const authorization = currentUser.authorization;
        if (!authorization) {
            throw new common_1.ForbiddenException('Authorization context is required');
        }
        if (authorization.isSuperadmin) {
            return context;
        }
        const accessScope = authorization.permissions['analytics.view'];
        if (!accessScope) {
            throw new common_1.ForbiddenException('Missing permission analytics.view');
        }
        if (Number(authorization.businessId) !== Number(context.business_id)) {
            throw new common_1.ForbiddenException('Branch does not belong to user business');
        }
        if (ACCESS_SCOPE_WEIGHT[accessScope] >= ACCESS_SCOPE_WEIGHT.business) {
            return context;
        }
        if (!authorization.branchIds.includes(branchId)) {
            throw new common_1.ForbiddenException('Branch is not assigned to user');
        }
        if (accessScope === 'own') {
            const allowedResourceIds = await this.branchStatsRepository.findAssignedResourceIds(authorization.userId, branchId);
            return {
                ...context,
                allowedResourceIds,
            };
        }
        return context;
    }
    async loadCapacityRows(branchId, range, resourceId, serviceId, allowedResourceIds) {
        const resources = await this.branchStatsRepository.findActiveResources(branchId, resourceId, allowedResourceIds);
        if (resourceId !== undefined && resources.length === 0) {
            throw new common_1.NotFoundException('Resource not found for branch');
        }
        const resourceIds = resources.map((resource) => resource.id);
        const [schedules, blocks, bookings] = await Promise.all([
            this.branchStatsRepository.findActiveSchedules(resourceIds),
            this.branchStatsRepository.findBlocks(resourceIds, range.rangeStart, range.rangeEnd),
            this.branchStatsRepository.findBookings(branchId, range.rangeStart, range.rangeEnd, resourceId, serviceId, allowedResourceIds),
        ]);
        return {
            resources,
            schedules,
            blocks,
            bookings,
        };
    }
    resolvePeriodRange(period, timeZone) {
        const today = (0, timezone_1.getLocalDateFromInstant)(new Date(), timeZone);
        let from = today;
        let to = today;
        if (period === 'week') {
            const daysSinceMonday = ((0, timezone_1.getDayOfWeek)(today) + 6) % 7;
            from = (0, timezone_1.addDays)(today, -daysSinceMonday);
            to = (0, timezone_1.addDays)(from, 6);
        }
        if (period === 'month') {
            from = { year: today.year, month: today.month, day: 1 };
            to = this.lastDayOfMonth(today.year, today.month);
        }
        if (period === 'year') {
            from = { year: today.year, month: 1, day: 1 };
            to = { year: today.year, month: 12, day: 31 };
        }
        const { start: rangeStart } = (0, timezone_1.localDateRangeToUtc)(from, timeZone);
        const { end: rangeEnd } = (0, timezone_1.localDateRangeToUtc)(to, timeZone);
        return {
            period,
            from,
            to,
            rangeStart,
            rangeEnd,
        };
    }
    calculateAvailableMinutes(dates, schedules, blocks, timeZone) {
        return dates.reduce((total, date) => {
            return (total +
                this.getMergedScheduleRangesForDate(date, schedules, timeZone).reduce((dayTotal, range) => {
                    return (dayTotal +
                        this.getAvailableMinutesForRange(range, blocks.filter((block) => block.resource_id === range.resourceId)));
                }, 0));
        }, 0);
    }
    addAvailableMinutesToCells(cells, dates, schedules, blocks, timeZone) {
        for (const date of dates) {
            const apiDayOfWeek = this.toApiDayOfWeek((0, timezone_1.getDayOfWeek)(date));
            for (const scheduleRange of this.getMergedScheduleRangesForDate(date, schedules, timeZone)) {
                const resourceBlocks = blocks.filter((block) => block.resource_id === scheduleRange.resourceId);
                for (const hour of this.hours()) {
                    const hourRange = this.hourToUtcRange(date, hour, timeZone);
                    const availableMinutes = this.getAvailableMinutesForRange({
                        start: scheduleRange.start > hourRange.start
                            ? scheduleRange.start
                            : hourRange.start,
                        end: scheduleRange.end < hourRange.end
                            ? scheduleRange.end
                            : hourRange.end,
                    }, resourceBlocks);
                    if (availableMinutes <= 0) {
                        continue;
                    }
                    cells.get(this.cellKey(apiDayOfWeek, hour)).availableMinutes +=
                        availableMinutes;
                }
            }
        }
    }
    addReservedMinutesToCells(cells, bookings, range, timeZone) {
        const dates = this.enumerateDates(range.from, range.to);
        for (const date of dates) {
            const dayRange = (0, timezone_1.localDateRangeToUtc)(date, timeZone);
            const apiDayOfWeek = this.toApiDayOfWeek((0, timezone_1.getDayOfWeek)(date));
            const dayBookings = bookings.filter((booking) => this.toDate(booking.start_at) < dayRange.end &&
                this.toDate(booking.end_at) > dayRange.start);
            for (const booking of dayBookings) {
                for (const hour of this.hours()) {
                    const hourRange = this.hourToUtcRange(date, hour, timeZone);
                    const reservedMinutes = this.getOverlapMinutes(this.toDate(booking.start_at), this.toDate(booking.end_at), hourRange.start, hourRange.end);
                    if (reservedMinutes <= 0) {
                        continue;
                    }
                    cells.get(this.cellKey(apiDayOfWeek, hour)).reservedMinutes +=
                        reservedMinutes;
                }
            }
        }
    }
    getMergedScheduleRangesForDate(date, schedules, timeZone) {
        const dayOfWeek = (0, timezone_1.getDayOfWeek)(date);
        const rangesByResource = schedules
            .filter((schedule) => Number(schedule.day_of_week) === dayOfWeek)
            .reduce((result, schedule) => {
            const ranges = result.get(schedule.resource_id) ?? [];
            ranges.push(this.scheduleToUtcRange(schedule, date, timeZone));
            result.set(schedule.resource_id, ranges);
            return result;
        }, new Map());
        const ranges = [];
        for (const [resourceId, resourceRanges] of rangesByResource) {
            for (const range of this.mergeRanges(resourceRanges.sort((left, right) => left.start.getTime() - right.start.getTime()))) {
                ranges.push({
                    resourceId,
                    ...range,
                });
            }
        }
        return ranges;
    }
    getAvailableMinutesForRange(range, blocks) {
        const rangeMinutes = this.getOverlapMinutes(range.start, range.end, range.start, range.end);
        if (rangeMinutes <= 0) {
            return 0;
        }
        const blockedRanges = blocks
            .map((block) => ({
            start: this.maxDate(this.toDate(block.start_at), range.start),
            end: this.minDate(this.toDate(block.end_at), range.end),
        }))
            .filter((block) => block.start < block.end)
            .sort((left, right) => left.start.getTime() - right.start.getTime());
        const blockedMinutes = this.mergeRanges(blockedRanges).reduce((total, block) => total +
            this.getOverlapMinutes(block.start, block.end, range.start, range.end), 0);
        return Math.max(0, rangeMinutes - blockedMinutes);
    }
    scheduleToUtcRange(schedule, date, timeZone) {
        const startTime = (0, timezone_1.parseTime)(schedule.start_time);
        const endTime = (0, timezone_1.parseTime)(schedule.end_time);
        if (!startTime || !endTime) {
            throw new common_1.BadRequestException('Resource schedule time is invalid');
        }
        return {
            start: (0, timezone_1.zonedDateTimeToUtc)(date, startTime, timeZone),
            end: (0, timezone_1.zonedDateTimeToUtc)(date, endTime, timeZone),
        };
    }
    hourToUtcRange(date, hour, timeZone) {
        const startTime = (0, timezone_1.parseTime)(`${hour}:00`);
        if (!startTime) {
            throw new common_1.BadRequestException('Heatmap hour is invalid');
        }
        return {
            start: (0, timezone_1.zonedDateTimeToUtc)(date, startTime, timeZone),
            end: (0, timezone_1.zonedDateTimeToUtc)(startTime.hour === 23 ? (0, timezone_1.addDays)(date, 1) : date, {
                hour: startTime.hour === 23 ? 0 : startTime.hour + 1,
                minute: 0,
                second: 0,
            }, timeZone),
        };
    }
    createHeatmapCells() {
        const cells = new Map();
        DAY_NAMES.forEach((day, index) => {
            const dayOfWeek = index + 1;
            for (const hour of this.hours()) {
                cells.set(this.cellKey(dayOfWeek, hour), {
                    dayOfWeek,
                    day,
                    hour,
                    reservedMinutes: 0,
                    availableMinutes: 0,
                });
            }
        });
        return cells;
    }
    findPeakCell(cells) {
        return [...cells.values()].reduce((peak, cell) => {
            if (cell.availableMinutes <= 0) {
                return peak;
            }
            if (!peak) {
                return cell;
            }
            return this.percentage(cell.reservedMinutes, cell.availableMinutes) >
                this.percentage(peak.reservedMinutes, peak.availableMinutes)
                ? cell
                : peak;
        }, null);
    }
    isValidBooking(booking) {
        return VALID_BOOKING_STATUSES.includes(booking.status);
    }
    startsInsideRange(booking, rangeStart, rangeEnd) {
        const startAt = this.toDate(booking.start_at);
        return startAt >= rangeStart && startAt < rangeEnd;
    }
    getOverlapMinutes(start, end, rangeStart, rangeEnd) {
        const overlapStart = this.maxDate(start, rangeStart);
        const overlapEnd = this.minDate(end, rangeEnd);
        if (overlapEnd <= overlapStart) {
            return 0;
        }
        return Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 60_000);
    }
    mergeRanges(ranges) {
        const merged = [];
        for (const range of ranges) {
            const previous = merged[merged.length - 1];
            if (!previous || range.start > previous.end) {
                merged.push({ ...range });
                continue;
            }
            if (range.end > previous.end) {
                previous.end = range.end;
            }
        }
        return merged;
    }
    enumerateDates(from, to) {
        const dates = [];
        let current = from;
        while (this.compareLocalDates(current, to) <= 0) {
            dates.push(current);
            current = (0, timezone_1.addDays)(current, 1);
        }
        return dates;
    }
    parsePeriod(period, allowedPeriods) {
        if (typeof period !== 'string' || !allowedPeriods.includes(period)) {
            throw new common_1.BadRequestException(`period must be one of: ${allowedPeriods.join(', ')}`);
        }
        return period;
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
    lastDayOfMonth(year, month) {
        const date = new Date(Date.UTC(year, month, 0));
        return {
            year,
            month,
            day: date.getUTCDate(),
        };
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
    formatDate(date) {
        return [
            String(date.year).padStart(4, '0'),
            String(date.month).padStart(2, '0'),
            String(date.day).padStart(2, '0'),
        ].join('-');
    }
    toApiDayOfWeek(schemaDayOfWeek) {
        return schemaDayOfWeek === 0 ? 7 : schemaDayOfWeek;
    }
    hours() {
        return Array.from({ length: 24 }, (_value, hour) => `${String(hour).padStart(2, '0')}:00`);
    }
    cellKey(dayOfWeek, hour) {
        return `${dayOfWeek}-${hour}`;
    }
    percentage(numerator, denominator) {
        if (denominator <= 0) {
            return 0;
        }
        return Math.round((numerator / denominator) * 10_000) / 100;
    }
    toDate(value) {
        return value instanceof Date ? value : new Date(value);
    }
    maxDate(left, right) {
        return left > right ? left : right;
    }
    minDate(left, right) {
        return left < right ? left : right;
    }
};
exports.BranchStatsService = BranchStatsService;
exports.BranchStatsService = BranchStatsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [branch_stats_repository_1.BranchStatsRepository,
        branches_repository_1.BranchesRepository])
], BranchStatsService);
//# sourceMappingURL=branch-stats.service.js.map