import { ConflictException, NotFoundException } from '@nestjs/common';
import { AuthorizationScopeService } from '../../auth/authorization-scope.service';
import { User } from '../../users/entities/user.entity';
import { PaymentsService } from '../payments.service';
import { PaymentsRepository } from '../payments.repository';

const user = {
  authorization: {
    userId: 7,
    businessId: 1,
    branchIds: [2],
    roles: [],
  },
} as User;

describe('Sale payments without cash or bookings', () => {
  const tx = {
    lockTarget: jest.fn(),
    paidAmount: jest.fn(),
    insert: jest.fn(),
    findPayment: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const repository = {
    withTransaction: jest.fn(),
    findByIdForBusiness: jest.fn(),
  };
  const service = new PaymentsService(
    repository as unknown as PaymentsRepository,
    new AuthorizationScopeService(),
  );

  beforeEach(() => {
    jest.resetAllMocks();
    repository.withTransaction.mockImplementation((_access, work) => work(tx));
    tx.lockTarget.mockResolvedValue({ total_price: 100, status: 'COMPLETED' });
    tx.paidAmount.mockResolvedValue(20);
    tx.insert.mockImplementation((record) =>
      Promise.resolve({ id: 1, ...record }),
    );
  });

  it('rejects a sale outside the authenticated business before inserting a payment', async () => {
    tx.lockTarget.mockResolvedValue(null);
    await expect(
      service.createForBusiness({ sale_id: 3, amount: 10 }, user),
    ).rejects.toThrow(NotFoundException);
    expect(tx.insert).not.toHaveBeenCalled();
    expect(repository.withTransaction.mock.calls[0][0]).toMatchObject({
      businessId: 1,
      filter: {},
    });
  });

  it('serializes balance validation on the sale and rejects overpayment', async () => {
    await expect(
      service.createForBusiness({ sale_id: 3, amount: 81 }, user),
    ).rejects.toThrow(ConflictException);
    expect(tx.insert).not.toHaveBeenCalled();
    expect(tx.lockTarget.mock.invocationCallOrder[0]).toBeLessThan(
      tx.paidAmount.mock.invocationCallOrder[0],
    );
  });

  it('completes only the remaining balance using the current payment status', async () => {
    await expect(
      service.completeForBusiness({ sale_id: 3 }, user),
    ).resolves.toMatchObject({ saleRemainingAmount: 0 });
    expect(tx.insert).toHaveBeenCalledWith({
      sale_id: 3,
      amount: 80,
      status: 'COMPLETED',
    });
  });

  it('rejects the removed booking and cash fields', async () => {
    await expect(
      service.createForBusiness(
        { sale_id: 3, amount: 10, booking_id: 2 } as never,
        user,
      ),
    ).rejects.toThrow('Unsupported payment fields');
    await expect(
      service.createForBusiness(
        { sale_id: 3, amount: 10, payment_method: 'CASH' } as never,
        user,
      ),
    ).rejects.toThrow('Unsupported payment fields');
    expect(repository.withTransaction).not.toHaveBeenCalled();
  });

  it('allows payments within the business without individual grants', async () => {
    await expect(
      service.createForBusiness({ sale_id: 3, amount: 10 }, user),
    ).resolves.toMatchObject({ id: 1 });
    expect(repository.withTransaction.mock.calls[0][0]).toEqual({
      businessId: 1,
      userId: 7,
      filter: {},
    });
  });

  it('rejects missing business context before opening a transaction', async () => {
    await expect(
      service.createForBusiness({ sale_id: 3, amount: 10 }, {
        authorization: { ...user.authorization!, businessId: null },
      } as User),
    ).rejects.toThrow('User must belong to a business');
    expect(repository.withTransaction).not.toHaveBeenCalled();
  });
});
