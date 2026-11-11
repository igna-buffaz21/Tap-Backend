import { DatabaseService } from '../../../database/database.service';
import { SaleItemsRepository } from '../../sale-items/sale-items.repository';
import { StockMovementsRepository } from '../../stock-movements/stock-movements.repository';
import { SalesRepository } from '../sales.repository';
import { SalesService } from '../sales.service';
import { AuthorizationScopeService } from '../../auth/authorization-scope.service';
import { User } from '../../users/entities/user.entity';
import { BadRequestException } from '@nestjs/common';

describe('SalesRepository stock transaction', () => {
  const client = { query: jest.fn() };
  const database = { query: jest.fn(), withTransaction: jest.fn() };
  const saleItemsRepository = { createMany: jest.fn() };
  const stockMovementsRepository = {
    validateSaleStockAvailabilityInTransaction: jest.fn(),
    createBulkAndApplyInTransaction: jest.fn(),
  };
  const repository = new SalesRepository(
    database as unknown as DatabaseService,
    saleItemsRepository as unknown as SaleItemsRepository,
    stockMovementsRepository as unknown as StockMovementsRepository,
  );

  const service = new SalesService(repository, new AuthorizationScopeService());
  const user = (userId = 7) =>
    ({
      authorization: {
        userId,
        businessId: 1,
        branchIds: [2],
        roles: [],
      },
    }) as User;
  const sale = {
    branch_id: 2,
    customer_id: null,
    discount_amount: 100,
    notes: null,
    items: [{ product_id: 9, quantity: 2, unit_price: 1500, subtotal: 3000 }],
  };

  beforeEach(() => {
    database.query.mockReset().mockImplementation(async (sql: string) => {
      if (sql.includes('FROM product'))
        return { rows: [{ id: 9, sale_price: 1500 }] };
      return { rows: [], rowCount: 1 };
    });
    client.query
      .mockReset()
      .mockResolvedValueOnce({ rows: [{ sales_stock_enabled: true }] });
    saleItemsRepository.createMany.mockReset();
    stockMovementsRepository.validateSaleStockAvailabilityInTransaction.mockReset();
    stockMovementsRepository.createBulkAndApplyInTransaction.mockReset();
    database.withTransaction
      .mockReset()
      .mockImplementation((work) => work(client));
  });

  it('does not create a sale if the branch does not belong to the business', async () => {
    client.query.mockReset().mockResolvedValueOnce({ rows: [] });
    await expect(service.createForBusiness(sale, user())).rejects.toThrow(
      'Branch not found',
    );
    expect(saleItemsRepository.createMany).not.toHaveBeenCalled();
    expect(
      stockMovementsRepository.createBulkAndApplyInTransaction,
    ).not.toHaveBeenCalled();
  });

  it('does not create a sale when the accumulated stock is insufficient', async () => {
    stockMovementsRepository.validateSaleStockAvailabilityInTransaction.mockResolvedValue(
      {
        available: false,
        productId: 9,
        availableQuantity: 1,
        requestedQuantity: 2,
      },
    );

    await expect(
      service.createForBusiness(sale, user()),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(
      stockMovementsRepository.validateSaleStockAvailabilityInTransaction,
    ).toHaveBeenCalledWith(client, 1, 2, [
      expect.objectContaining({ product_id: 9, quantity: 2 }),
    ]);
    expect(client.query).toHaveBeenCalledTimes(1);
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = $1 AND business_id = $2'),
      [2, 1],
    );
    expect(saleItemsRepository.createMany).not.toHaveBeenCalled();
    expect(
      stockMovementsRepository.createBulkAndApplyInTransaction,
    ).not.toHaveBeenCalled();
  });

  it.each([true, false])(
    'creates a sale with sales_stock_enabled=%s',
    async (enabled) => {
      client.query
        .mockReset()
        .mockResolvedValueOnce({ rows: [{ sales_stock_enabled: enabled }] });
      stockMovementsRepository.validateSaleStockAvailabilityInTransaction.mockResolvedValue(
        { available: true },
      );
      client.query.mockResolvedValue({
        rows: [
          {
            id: 15,
            business_id: 1,
            branch_id: 2,
            customer_id: null,
            status: 'COMPLETED',
            subtotal: '3000.00',
            discount_amount: '100.00',
            total_amount: '2900.00',
            notes: null,
            created_by: 7,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });
      saleItemsRepository.createMany.mockResolvedValue([]);
      stockMovementsRepository.createBulkAndApplyInTransaction.mockResolvedValue(
        [],
      );

      await service.createForBusiness(sale, user());

      expect(saleItemsRepository.createMany).toHaveBeenCalledWith(
        client,
        15,
        sale.items,
      );
      if (!enabled) {
        expect(
          stockMovementsRepository.validateSaleStockAvailabilityInTransaction,
        ).not.toHaveBeenCalled();
        expect(
          stockMovementsRepository.createBulkAndApplyInTransaction,
        ).not.toHaveBeenCalled();
        return;
      }
      expect(
        stockMovementsRepository.createBulkAndApplyInTransaction,
      ).toHaveBeenCalledWith(
        client,
        1,
        {
          branch_id: 2,
          type: 'OUT',
          reason: 'SALE',
          notes: 'Venta #15',
          items: [{ product_id: 9, quantity: 2, unit_cost: null }],
        },
        7,
      );
    },
  );

  it('keeps the sale list inside the business and access scope', async () => {
    database.query
      .mockResolvedValueOnce({ rows: [{ total: '12' }] })
      .mockResolvedValueOnce({ rows: [] });

    await repository.findAllForBusiness(1, {
      allowedBranchIds: [2],
      createdByUserId: 7,
    });

    expect(database.query).toHaveBeenCalledWith(
      expect.stringContaining('s.business_id = $1'),
      [1, [2], 7],
    );
    expect(database.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4'),
      [1, [2], 7, 10, 0],
    );
    for (const [sql] of database.query.mock.calls) {
      expect(sql).toContain('s.business_id = $1');
      expect(sql).toContain('branch_id = ANY($2::bigint[])');
      expect(sql).toContain('created_by = $3');
    }
    expect(database.query.mock.calls[1][0]).toContain('OFFSET $5');
  });

  it('returns the requested page and total without loading sale items', async () => {
    database.query
      .mockResolvedValueOnce({ rows: [{ total: '12' }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 15,
            status: 'CANCELLED',
            created_by: 7,
            created_by_user_name: 'Juan Pérez',
            subtotal: '3000.00',
            discount_amount: '100.00',
            total_amount: '2900.00',
          },
        ],
      });

    const result = await repository.findAllForBusiness(1, undefined, {
      limit: 5,
      offset: 10,
    });

    expect(result).toEqual({
      sales: [
        {
          id: 15,
          status: 'CANCELLED',
          created_by: 7,
          created_by_user_name: 'Juan Pérez',
          subtotal: 3000,
          discount_amount: 100,
          total_amount: 2900,
        },
      ],
      total: 12,
    });
    expect(database.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('COUNT(*)'),
      [1],
    );
    expect(database.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('ORDER BY s.created_at DESC, s.id DESC'),
      [1, 5, 10],
    );
    expect(database.query.mock.calls[1][0]).toContain('LIMIT $2');
    expect(database.query.mock.calls[1][0]).toContain('OFFSET $3');
    expect(database.query.mock.calls[1][0]).toContain(
      'u.name AS created_by_user_name',
    );
    expect(database.query.mock.calls[1][0]).toContain('LEFT JOIN app_user u');
    expect(database.query.mock.calls[1][0]).toContain('u.id = s.created_by');
    expect(database.query.mock.calls[1][0]).toContain(
      'u.business_id = s.business_id OR u.business_id IS NULL',
    );
    expect(database.query).toHaveBeenCalledTimes(2);
  });

  it('keeps the sale and creator ID when no creator name is available', async () => {
    database.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 15,
            created_by: 7,
            created_by_user_name: null,
            subtotal: '3000.00',
            discount_amount: '100.00',
            total_amount: '2900.00',
          },
        ],
      });

    const result = await repository.findAllForBusiness(1);

    expect(result.total).toBe(1);
    expect(result.sales).toHaveLength(1);
    expect(result.sales[0]).toMatchObject({
      id: 15,
      created_by: 7,
      created_by_user_name: null,
    });
  });

  it('returns an empty page with the total when the offset is beyond the history', async () => {
    database.query
      .mockResolvedValueOnce({ rows: [{ total: '12' }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(
      repository.findAllForBusiness(1, undefined, {
        limit: 10,
        offset: 20,
      }),
    ).resolves.toEqual({ sales: [], total: 12 });
  });

  it('restricts both the count and page when the user has no allowed branches', async () => {
    await expect(
      repository.findAllForBusiness(1, {
        allowedBranchIds: [],
      }),
    ).resolves.toEqual({ sales: [], total: 0 });

    for (const [sql] of database.query.mock.calls) {
      expect(sql).toContain('s.business_id = $1');
      expect(sql).toContain('AND FALSE');
    }
  });

  it.each([true, false])(
    'cancels a sale with original stock movements=%s',
    async (hasStockMovement) => {
      client.query.mockReset();
      const saleRow = {
        id: 15,
        business_id: 1,
        branch_id: 2,
        customer_id: null,
        status: 'COMPLETED',
        subtotal: '3000.00',
        discount_amount: '100.00',
        total_amount: '2900.00',
        notes: null,
        created_by: 7,
        created_at: new Date(),
        updated_at: new Date(),
      };
      client.query
        .mockResolvedValueOnce({ rows: [saleRow] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 20,
              sale_id: 15,
              product_id: 9,
              quantity: '2.000',
              unit_price: '1500.00',
              subtotal: '3000.00',
              created_at: new Date(),
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ has_stock_movement: hasStockMovement }],
        })
        .mockResolvedValueOnce({ rows: [{ ...saleRow, status: 'CANCELLED' }] });
      stockMovementsRepository.createBulkAndApplyInTransaction.mockResolvedValue(
        [],
      );

      const result = await service.cancelForBusiness(15, user(8));

      expect(result.status).toBe('CANCELLED');
      expect(client.query).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('business_id = $1 AND branch_id = $2'),
        [1, 2, 'Venta #15'],
      );
      if (!hasStockMovement) {
        expect(
          stockMovementsRepository.createBulkAndApplyInTransaction,
        ).not.toHaveBeenCalled();
        return;
      }
      expect(
        stockMovementsRepository.createBulkAndApplyInTransaction,
      ).toHaveBeenCalledWith(
        client,
        1,
        {
          branch_id: 2,
          type: 'IN',
          reason: 'SALE_CANCELLATION',
          notes: 'Anulación de venta #15',
          items: [{ product_id: 9, quantity: 2, unit_cost: null }],
        },
        8,
      );
      expect(client.query.mock.calls[0][0]).toContain('FOR UPDATE');
      expect(client.query.mock.calls[3][0]).toContain("status = 'CANCELLED'");
    },
  );
});
