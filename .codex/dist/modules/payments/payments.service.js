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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const payment_constants_1 = require("./payment.constants");
const payments_repository_1 = require("./payments.repository");
let PaymentsService = class PaymentsService {
    paymentsRepository;
    constructor(paymentsRepository) {
        this.paymentsRepository = paymentsRepository;
    }
    async create(createPaymentDto) {
        const bookingId = this.parsePositiveInteger(createPaymentDto.booking_id, 'booking_id');
        const amount = this.parsePositiveAmount(createPaymentDto.amount);
        const method = this.validateMethod(createPaymentDto.method);
        const status = this.validateStatus(createPaymentDto.status ?? 'PAID');
        const paidAt = this.resolvePaidAt(createPaymentDto.paid_at, status);
        const reference = this.validateReference(createPaymentDto.reference);
        const summary = await this.paymentsRepository.findBookingPaymentSummary(bookingId);
        if (!summary) {
            throw new common_1.NotFoundException('Booking not found');
        }
        const totalPrice = Number(summary.total_price);
        const paidAmount = Number(summary.paid_amount);
        if (status === 'PAID' && paidAmount + amount > totalPrice) {
            throw new common_1.ConflictException('Payment amount exceeds the booking total price');
        }
        const payment = await this.paymentsRepository.create({
            booking_id: bookingId,
            amount,
            method,
            status,
            paid_at: paidAt,
            reference,
        });
        return {
            id: payment.id,
            bookingId: payment.booking_id,
            amount: Number(payment.amount),
            method: payment.method,
            status: payment.status,
            paidAt: payment.paid_at,
            reference: payment.reference,
            bookingTotalPrice: totalPrice,
            bookingPaidAmount: status === 'PAID' ? paidAmount + amount : paidAmount,
            bookingRemainingAmount: totalPrice - (status === 'PAID' ? paidAmount + amount : paidAmount),
        };
    }
    findAll() {
        return this.paymentsRepository.findAll();
    }
    findOne(id) {
        return this.paymentsRepository.findById(id);
    }
    update(id, updatePaymentDto) {
        return this.paymentsRepository.update(id, updatePaymentDto);
    }
    remove(id) {
        return this.paymentsRepository.remove(id);
    }
    parsePositiveInteger(value, field) {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new common_1.BadRequestException(`${field} must be a positive integer`);
        }
        return parsed;
    }
    parsePositiveAmount(value) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            throw new common_1.BadRequestException('amount must be a positive number');
        }
        return parsed;
    }
    validateMethod(method) {
        if (typeof method !== 'string') {
            throw new common_1.BadRequestException('method is invalid');
        }
        if (!payment_constants_1.PAYMENT_METHODS.includes(method)) {
            throw new common_1.BadRequestException('method is invalid');
        }
        return method;
    }
    validateStatus(status) {
        if (typeof status !== 'string') {
            throw new common_1.BadRequestException('status is invalid');
        }
        if (!payment_constants_1.PAYMENT_STATUSES.includes(status)) {
            throw new common_1.BadRequestException('status is invalid');
        }
        return status;
    }
    resolvePaidAt(paidAt, status) {
        if (paidAt === undefined || paidAt === null || paidAt === '') {
            return status === 'PAID' ? new Date().toISOString() : null;
        }
        const parsed = new Date(paidAt);
        if (Number.isNaN(parsed.getTime())) {
            throw new common_1.BadRequestException('paid_at must be a valid ISO datetime');
        }
        return parsed.toISOString();
    }
    validateReference(reference) {
        if (reference === undefined || reference === null) {
            return null;
        }
        if (typeof reference !== 'string') {
            throw new common_1.BadRequestException('reference must be a string or null');
        }
        return reference;
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [payments_repository_1.PaymentsRepository])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map