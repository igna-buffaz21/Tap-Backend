import { BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { User } from '../../users/entities/user.entity';
import { ProductCategoriesService } from '../product-categories.service';
import { ProductCategoriesRepository } from '../product-categories.repository';

const user = {
  authorization: { userId: 7, businessId: 1, branchIds: [], roles: [] },
} as unknown as User;

describe('ProductCategoriesService status persistence', () => {
  const database = {
    query: jest.fn(),
    withTransaction: jest.fn(),
  };
  const repository = new ProductCategoriesRepository(
    database as unknown as DatabaseService,
  );
  const service = new ProductCategoriesService(repository);

  beforeEach(() => {
    jest.resetAllMocks();
    database.withTransaction.mockImplementation((work) => work(database));
    database.query.mockImplementation(
      async (sql: string, values: unknown[]) => {
        const status = sql.includes('INSERT INTO') ? values.at(-1) : values[0];
        // Reproduce the documented database CHECK without connecting to PostgreSQL.
        if (status !== 'ACTIVE' && status !== 'INACTIVE') {
          throw new Error('status check constraint violation');
        }
        return {
          rows: [
            {
              id: 3,
              business_id: 1,
              status,
              cost_price: null,
              sale_price: null,
            },
          ],
          rowCount: 1,
        };
      },
    );
  });

  it.each([
    [undefined, 'ACTIVE'],
    ['active', 'ACTIVE'],
    ['inactive', 'INACTIVE'],
    ['ACTIVE', 'ACTIVE'],
    [' INACTIVE ', 'INACTIVE'],
  ])(
    'creates with status %p as %s in the database',
    async (input, expected) => {
      await expect(
        service.createForBusiness({ name: 'Example', status: input }, user),
      ).resolves.toMatchObject({ status: expected });
      const [sql, values] = database.query.mock.calls[0];
      expect(sql).toContain('INSERT INTO');
      expect(values[0]).toBe(1);
      expect(values.at(-1)).toBe(expected);
    },
  );

  it.each([
    ['inactive', 'INACTIVE'],
    [' ACTIVE ', 'ACTIVE'],
  ])(
    'updates status %p as %s while preserving the tenant filter',
    async (input, expected) => {
      await expect(
        service.updateStatusForBusiness(3, { status: input }, user),
      ).resolves.toMatchObject({ status: expected });
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('AND business_id = $3'),
        [expected, 3, 1],
      );
    },
  );

  it('rejects invalid statuses before writing', async () => {
    await expect(
      service.createForBusiness({ name: 'Example', status: 'deleted' }, user),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.updateStatusForBusiness(3, { status: 'deleted' }, user),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(database.query).not.toHaveBeenCalled();
  });
});
