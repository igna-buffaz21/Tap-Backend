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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const phone_1 = require("../../common/utils/phone");
const timezone_1 = require("../../common/utils/timezone");
const booking_constants_1 = require("../bookings/booking.constants");
const customers_repository_1 = require("./customers.repository");
let CustomersService = class CustomersService {
    customersRepository;
    constructor(customersRepository) {
        this.customersRepository = customersRepository;
    }
    create(createCustomerDto) {
        return this.customersRepository.create({
            ...createCustomerDto,
            phone: (0, phone_1.normalizePhone)(createCustomerDto.phone),
        });
    }
    async createForBusiness(createCustomerDto, currentUser, businessIdValue) {
        const access = await this.resolveCustomerAccess(currentUser, businessIdValue);
        const customer = await this.getOrCreateByPhone({
            name: createCustomerDto.name,
            phone: createCustomerDto.phone,
            email: createCustomerDto.email,
        });
        await this.addToBusiness(customer.id, access.businessId);
        return customer;
    }
    findAll() {
        return this.customersRepository.findAll();
    }
    async getStatsForBusiness(currentUser, businessIdValue) {
        const access = await this.resolveCustomerAccess(currentUser, businessIdValue);
        const stats = await this.customersRepository.getStatsForBusiness(access.businessId, access.filter);
        return {
            businessId: access.businessId,
            totalCustomers: Number(stats.total_customers),
            newCustomersThisMonth: Number(stats.new_customers_this_month),
        };
    }
    async findAllForBusiness(currentUser, businessIdValue, pageValue, limitValue, searchValue) {
        const access = await this.resolveCustomerAccess(currentUser, businessIdValue);
        const { page, limit, offset } = this.parsePagination(pageValue, limitValue, 100, 20);
        const search = this.parseSearch(searchValue);
        const rows = await this.customersRepository.findPageForBusiness(access.businessId, limit, offset, search.textPattern, search.phonePatterns, access.filter);
        const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
        return {
            data: rows.map((row) => this.mapCustomerListItem(row)),
            pagination: this.buildPagination(page, limit, total),
        };
    }
    findOne(id) {
        return this.customersRepository.findById(id);
    }
    async findOneForBusiness(id, currentUser, businessIdValue, historyPageValue, historyLimitValue) {
        const customerId = this.parsePositiveInteger(id, 'id');
        const access = await this.resolveCustomerAccess(currentUser, businessIdValue);
        const historyPagination = this.parsePagination(historyPageValue, historyLimitValue, 100, 20);
        const customer = await this.customersRepository.findDetailForBusiness(customerId, access.businessId, access.filter);
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found for business');
        }
        const historyRows = await this.customersRepository.findBookingHistoryForBusiness(customerId, access.businessId, historyPagination.limit, historyPagination.offset, access.filter?.allowedBranchIds);
        const historyTotal = historyRows.length > 0 ? Number(historyRows[0].total_count) : 0;
        return this.mapCustomerDetail(customer, historyRows, this.buildPagination(historyPagination.page, historyPagination.limit, historyTotal));
    }
    async findByPhone(phone) {
        return this.customersRepository.findByPhones((0, phone_1.buildPhoneLookupCandidates)(phone));
    }
    async findByPhoneForBusiness(phoneValue, currentUser, businessIdValue) {
        const phone = this.parsePhone(phoneValue);
        const access = await this.resolveCustomerAccess(currentUser, businessIdValue);
        return this.customersRepository.findByPhonesForBusiness((0, phone_1.buildPhoneLookupCandidates)(phone), access.businessId, access.filter);
    }
    async getOrCreateByPhone(input) {
        const phone = (0, phone_1.normalizePhone)(input.phone);
        const existingCustomer = await this.customersRepository.findByPhones((0, phone_1.buildPhoneLookupCandidates)(input.phone));
        const email = input.email === undefined
            ? `whatsapp-${phone}@local.invalid`
            : this.normalizeEmail(input.email);
        if (existingCustomer) {
            if (input.email !== undefined && existingCustomer.email !== email) {
                return ((await this.customersRepository.update(existingCustomer.id, {
                    email,
                })) ?? existingCustomer);
            }
            return existingCustomer;
        }
        try {
            return await this.customersRepository.create({
                name: input.name?.trim() || phone,
                phone,
                email,
            });
        }
        catch (error) {
            if (!this.isUniqueViolation(error)) {
                throw error;
            }
            const concurrentCustomer = await this.customersRepository.findByPhones((0, phone_1.buildPhoneLookupCandidates)(input.phone));
            if (!concurrentCustomer) {
                throw error;
            }
            return concurrentCustomer;
        }
    }
    async addToBusiness(customerId, businessId, executor) {
        await this.customersRepository.addToBusiness(customerId, businessId, executor);
    }
    update(id, updateCustomerDto) {
        return this.customersRepository.update(id, this.normalizeUpdateDto(updateCustomerDto));
    }
    async updateForBusiness(id, updateCustomerDto, currentUser, businessIdValue) {
        const customerId = this.parsePositiveInteger(id, 'id');
        const access = await this.resolveCustomerAccess(currentUser, businessIdValue);
        const updatedCustomer = await this.customersRepository.updateForBusiness(customerId, access.businessId, this.normalizeUpdateDto(updateCustomerDto), access.filter);
        if (!updatedCustomer) {
            throw new common_1.NotFoundException('Customer not found for business');
        }
        return updatedCustomer;
    }
    remove(id) {
        return this.customersRepository.remove(id);
    }
    async removeFromBusiness(id, currentUser, businessIdValue) {
        const customerId = this.parsePositiveInteger(id, 'id');
        const access = await this.resolveCustomerAccess(currentUser, businessIdValue);
        const removed = await this.customersRepository.removeFromBusiness(customerId, access.businessId, access.filter);
        if (!removed) {
            throw new common_1.NotFoundException('Customer not found for business');
        }
        return { deleted: true };
    }
    async resolveCustomerAccess(currentUser, businessIdValue) {
        const authorization = currentUser.authorization;
        if (!authorization) {
            throw new common_1.ForbiddenException('Authorization context is required');
        }
        if (authorization.isSuperadmin) {
            const businessId = this.parsePositiveInteger(businessIdValue, 'businessId');
            await this.assertBusinessExists(businessId);
            return {
                businessId,
                accessScope: 'business',
            };
        }
        const accessScope = authorization.permissions['customer.manage'];
        if (!accessScope) {
            throw new common_1.ForbiddenException('Missing permission customer.manage');
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
            filter: this.buildCustomerAccessFilter(accessScope, authorization.branchIds, authorization.userId),
        };
    }
    buildCustomerAccessFilter(accessScope, branchIds, userId) {
        if (accessScope === 'business') {
            return undefined;
        }
        if (accessScope === 'branch') {
            return {
                allowedBranchIds: branchIds,
            };
        }
        return {
            allowedBranchIds: branchIds,
            assignedUserId: userId,
            ownOnly: true,
        };
    }
    requireBusinessUserBusinessId(businessId) {
        if (businessId === undefined || businessId === null || businessId === '') {
            throw new common_1.ForbiddenException('User must belong to a business');
        }
        return this.parsePositiveInteger(businessId, 'businessId');
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
    parsePhone(value) {
        if (typeof value !== 'string') {
            throw new common_1.BadRequestException('phone must be a string');
        }
        const phone = value.trim();
        if (!phone || phone.replace(/\D/g, '').length === 0) {
            throw new common_1.BadRequestException('phone must contain digits');
        }
        return phone;
    }
    async assertBusinessExists(businessId) {
        const exists = await this.customersRepository.businessExists(businessId);
        if (!exists) {
            throw new common_1.NotFoundException('Business not found');
        }
    }
    normalizeUpdateDto(updateCustomerDto) {
        this.assertOnlyEditableUpdateFields(updateCustomerDto);
        return {
            phone: updateCustomerDto.phone === undefined
                ? undefined
                : (0, phone_1.normalizePhone)(updateCustomerDto.phone),
            email: updateCustomerDto.email === undefined
                ? undefined
                : this.normalizeEmail(updateCustomerDto.email),
        };
    }
    assertOnlyEditableUpdateFields(updateCustomerDto) {
        const allowedFields = ['phone', 'email'];
        const providedUnsupportedFields = Object.keys(updateCustomerDto).filter((field) => !allowedFields.includes(field));
        if (providedUnsupportedFields.length > 0) {
            throw new common_1.BadRequestException(`${providedUnsupportedFields.join(', ')} cannot be updated`);
        }
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
        const digits = search.replace(/\D/g, '');
        const phonePatterns = digits.length === 0
            ? ['']
            : (0, phone_1.buildPhoneLookupCandidates)(search).map((candidate) => this.toLikePattern(candidate));
        return {
            textPattern: this.toLikePattern(search),
            phonePatterns,
        };
    }
    toLikePattern(value) {
        return `%${value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
    }
    buildPagination(page, limit, total) {
        return {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        };
    }
    mapCustomerListItem(row) {
        return {
            id: row.id,
            name: row.name,
            phone: row.phone,
            email: row.email,
            customerSince: row.customer_since,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            bookingsCount: Number(row.bookings_count),
            noShowCount: Number(row.no_show_count),
            cancellationsCount: Number(row.cancellations_count),
            customerType: this.resolveCustomerFrequencyType(Number(row.completed_count), Number(row.completed_last_window_count)),
            lastBookingAt: row.last_booking_at,
            nextBookingAt: row.next_booking_at,
        };
    }
    mapCustomerDetail(row, historyRows, historyPagination) {
        return {
            id: row.id,
            name: row.name,
            phone: row.phone,
            email: row.email,
            customerSince: this.formatInstant(row.customer_since, row.business_timezone),
            customerSinceDate: this.formatDate(row.customer_since, row.business_timezone),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            stats: {
                bookingsCount: Number(row.bookings_count),
                noShowCount: Number(row.no_show_count),
                cancellationsCount: Number(row.cancellations_count),
                customerType: this.resolveCustomerFrequencyType(Number(row.completed_count), Number(row.completed_last_window_count)),
                lastBookingAt: this.formatNullableInstant(row.last_booking_at, row.business_timezone),
                lastBookingDate: this.formatNullableDate(row.last_booking_at, row.business_timezone),
            },
            history: {
                data: historyRows.map((booking) => this.mapCustomerBookingHistory(booking, row.business_timezone)),
                pagination: historyPagination,
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
    mapCustomerBookingHistory(row, timeZone) {
        return {
            id: row.id,
            startAt: this.formatInstant(row.start_at, timeZone),
            endAt: this.formatInstant(row.end_at, timeZone),
            date: this.formatDate(row.start_at, timeZone),
            shortDate: this.formatShortDate(row.start_at, timeZone),
            time: this.formatTime(row.start_at, timeZone),
            branch: {
                id: row.branch_id,
                name: row.branch_name,
            },
            resource: {
                id: row.resource_id,
                name: row.resource_name,
            },
            service: {
                id: row.service_id,
                name: row.service_name,
            },
            status: row.status,
            statusLabel: this.getBookingStatusLabel(row.status),
            confirmationStatus: row.confirmation_status,
            cancelledAt: this.formatNullableInstant(row.cancelled_at, timeZone),
            source: row.source,
            totalPrice: Number(row.total_price),
            reservationName: row.reservation_name,
            notes: row.notes,
        };
    }
    formatNullableInstant(value, timeZone) {
        return value === null ? null : this.formatInstant(value, timeZone);
    }
    formatNullableDate(value, timeZone) {
        return value === null ? null : this.formatDate(value, timeZone);
    }
    formatNullableDateTime(value, timeZone) {
        return value === null ? null : this.formatDateTime(value, timeZone);
    }
    formatInstant(value, timeZone) {
        return (0, timezone_1.formatInTimeZone)(this.toDate(value), timeZone);
    }
    formatDate(value, timeZone) {
        const formatted = this.formatInstant(value, timeZone);
        return `${formatted.slice(8, 10)}/${formatted.slice(5, 7)}/${formatted.slice(0, 4)}`;
    }
    formatShortDate(value, timeZone) {
        const formatted = this.formatInstant(value, timeZone);
        return `${formatted.slice(8, 10)}/${formatted.slice(5, 7)}`;
    }
    formatTime(value, timeZone) {
        return this.formatInstant(value, timeZone).slice(11, 16);
    }
    formatDateTime(value, timeZone) {
        return `${this.formatDate(value, timeZone)} ${this.formatTime(value, timeZone)}`;
    }
    toDate(value) {
        return value instanceof Date ? value : new Date(value);
    }
    getBookingStatusLabel(status) {
        switch (status.toUpperCase()) {
            case 'PENDING':
                return 'Pendiente';
            case 'CONFIRMED':
                return 'Confirmada';
            case 'COMPLETED':
                return 'Finalizada';
            case 'CANCELLED':
                return 'Cancelada';
            case 'NO_SHOW':
                return 'Ausente';
            default:
                return status;
        }
    }
    isUniqueViolation(error) {
        if (typeof error !== 'object' || error === null || !('code' in error)) {
            return false;
        }
        return error.code === '23505';
    }
    normalizeEmail(email) {
        const normalizedEmail = email?.trim().toLowerCase();
        return normalizedEmail || 'unknown@local.invalid';
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [customers_repository_1.CustomersRepository])
], CustomersService);
//# sourceMappingURL=customers.service.js.map