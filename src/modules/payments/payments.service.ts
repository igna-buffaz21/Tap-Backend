import { AuthorizationScopeService } from '../auth/authorization-scope.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CompletePaymentDto } from './dto/complete-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentsRepository } from './payments.repository';
import type {
  PaymentAccess,
  PaymentTarget,
  PaymentTransaction,
} from './payments.repository';
import { Payment } from './entities/payment.entity';
import type { PoolClient } from 'pg';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly repository: PaymentsRepository,
    private readonly authorizationScope: AuthorizationScopeService,
  ) {}

  async createForBusiness(dto: CreatePaymentDto, user: User) {
    return this.createPayment(dto, user);
  }

  // Reutiliza la transacción de venta; no abre ni confirma una transacción propia.
  async createForBusinessInTransaction(
    client: PoolClient,
    dto: CreatePaymentDto,
    user: User,
  ) {
    return this.createPayment(dto, user, client);
  }

  private async createPayment(
    dto: CreatePaymentDto,
    user: User,
    client?: PoolClient,
  ) {
    const access = await this.resolveAccess(user);
    this.assertKeys(dto, ['sale_id', 'amount', 'status']);
    const target = this.target(dto);
    const amount = this.amount(dto.amount);
    const status = dto.status ?? 'COMPLETED';
    if (!['PENDING', 'COMPLETED'].includes(status))
      throw new BadRequestException('status must be PENDING or COMPLETED');
    const work = async (tx: PaymentTransaction) => {
      const summary = await this.lockTarget(tx, target);
      const paidAmount = await tx.paidAmount(target);
      if (status === 'COMPLETED')
        this.assertWithinTotal(paidAmount, amount, summary.total_price);
      const payment = await tx.insert({ ...target, amount, status });
      return this.response(
        payment,
        summary.total_price,
        paidAmount + (status === 'COMPLETED' ? amount : 0),
      );
    };
    return client
      ? work(this.repository.inTransaction(client, access))
      : this.repository.withTransaction(access, work);
  }

  async completeForBusiness(dto: CompletePaymentDto, user: User) {
    const access = await this.resolveAccess(user);
    this.assertKeys(dto, ['sale_id']);
    const target = this.target(dto);
    return this.repository.withTransaction(access, async (tx) => {
      const summary = await this.lockTarget(tx, target);
      const paidAmount = await tx.paidAmount(target);
      const remainingCents =
        Math.round(summary.total_price * 100) - Math.round(paidAmount * 100);
      if (remainingCents <= 0)
        throw new ConflictException('The sale is already fully paid');
      const payment = await tx.insert({
        ...target,
        amount: remainingCents / 100,
        status: 'COMPLETED',
      });
      return this.response(payment, summary.total_price, summary.total_price);
    });
  }

  async findAllForBusiness(user: User) {
    const access = await this.resolveAccess(user);
    return this.repository.findAllForBusiness(access.businessId, access.filter);
  }

  async findOneForBusiness(id: number, user: User) {
    const access = await this.resolveAccess(user);
    return this.findPayment(this.id(id, 'id'), access);
  }

  async updateForBusiness(id: number, dto: UpdatePaymentDto, user: User) {
    const access = await this.resolveAccess(user);
    const paymentId = this.id(id, 'id');
    this.assertKeys(dto, ['amount', 'status']);
    if (Object.keys(dto).length === 0)
      throw new BadRequestException('No payment changes provided');
    const existing = await this.findPayment(paymentId, access);
    const target = this.target(existing);
    return this.repository.withTransaction(access, async (tx) => {
      const summary = await this.lockTarget(tx, target);
      // Primero se bloquea el dueño, igual que en creación/completado, para serializar el saldo.
      const payment = await tx.findPayment(paymentId);
      if (!payment) throw new NotFoundException('Payment not found');
      if (payment.sale_id !== target.sale_id)
        throw new ConflictException('Payment target changed');
      if (payment.status !== 'PENDING') {
        throw new ConflictException('Registered payments are immutable');
      }
      const status = dto.status ?? payment.status;
      if (!['PENDING', 'COMPLETED', 'CANCELLED'].includes(status))
        throw new BadRequestException('Invalid pending payment status');
      const amount =
        dto.amount === undefined ? payment.amount : this.amount(dto.amount);
      const paidAmount = await tx.paidAmount(target);
      if (status === 'COMPLETED')
        this.assertWithinTotal(paidAmount, amount, summary.total_price);
      const updated = await tx.update(paymentId, amount, status);

      return this.response(
        updated,
        summary.total_price,
        paidAmount + (status === 'COMPLETED' ? amount : 0),
      );
    });
  }

  async removeForBusiness(id: number, user: User) {
    const access = await this.resolveAccess(user);
    const paymentId = this.id(id, 'id');
    return this.repository.withTransaction(access, async (tx) => {
      const payment = await tx.findPayment(paymentId);
      if (!payment) throw new NotFoundException('Payment not found');
      if (!['PENDING', 'CANCELLED'].includes(payment.status)) {
        throw new ConflictException(
          'Registered payments cannot be deleted; registered payments are immutable',
        );
      }
      return tx.remove(paymentId);
    });
  }

  private async resolveAccess(user: User): Promise<PaymentAccess> {
    const authorization = this.authorizationScope.requireAuthorization(user);
    const businessId = this.authorizationScope.resolveBusinessId(user);
    return {
      businessId,
      userId: authorization.userId,
      filter: {},
    };
  }

  private async findPayment(id: number, access: PaymentAccess) {
    const payment = await this.repository.findByIdForBusiness(
      id,
      access.businessId,
      access.filter,
    );
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  private async lockTarget(tx: PaymentTransaction, target: PaymentTarget) {
    const summary = await tx.lockTarget(target);
    if (!summary)
      throw new NotFoundException('Sale not found in the authorized branch');
    if (summary.status === 'CANCELLED')
      throw new ConflictException(
        'Cannot register payments for a cancelled sale',
      );
    return summary;
  }

  private response(payment: Payment, total: number, paid: number) {
    return {
      id: payment.id,
      saleId: payment.sale_id,
      amount: Number(payment.amount),
      status: payment.status,
      paymentCreatedAt: payment.created_at,
      saleTotalAmount: total,
      salePaidAmount: paid,
      saleRemainingAmount: this.remaining(total, paid),
    };
  }

  private target(value: { sale_id?: unknown }): PaymentTarget {
    return { sale_id: this.id(value.sale_id, 'sale_id') };
  }

  private id(value: unknown, field: string): number {
    const parsed = Number(value);
    if (
      (typeof value !== 'number' && typeof value !== 'string') ||
      value === '' ||
      !Number.isSafeInteger(parsed) ||
      parsed <= 0
    ) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }
    return parsed;
  }

  private amount(value: unknown): number {
    const parsed = Number(value);
    if (
      (typeof value !== 'number' && typeof value !== 'string') ||
      !/^\d+(?:\.\d{1,2})?$/.test(String(value)) ||
      !Number.isFinite(parsed) ||
      parsed <= 0 ||
      parsed > 9999999999.99
    ) {
      throw new BadRequestException(
        'amount must be positive, at most 9999999999.99 and have at most 2 decimals',
      );
    }
    return parsed;
  }

  private assertWithinTotal(paid: number, amount: number, total: number) {
    if (
      Math.round(paid * 100) + Math.round(amount * 100) >
      Math.round(total * 100)
    ) {
      throw new ConflictException('Payment amount exceeds the sale total');
    }
  }

  private remaining(total: number, paid: number) {
    return (Math.round(total * 100) - Math.round(paid * 100)) / 100;
  }

  private assertKeys(value: object, allowed: string[]) {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      Object.keys(value).some((key) => !allowed.includes(key))
    ) {
      throw new BadRequestException(
        'Unsupported payment fields; business, branch and creator come from authentication',
      );
    }
  }
}
