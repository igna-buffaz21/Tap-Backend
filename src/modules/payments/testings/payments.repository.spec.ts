import { DatabaseService } from '../../../database/database.service';
import { PaymentsRepository } from '../payments.repository';
import type { PoolClient } from 'pg';

describe('PaymentsRepository sale ownership', () => {
  const query = jest.fn().mockResolvedValue({ rows: [] });
  const repository = new PaymentsRepository({
    query,
  } as unknown as DatabaseService);
  beforeEach(() => query.mockClear());

  it('filters payment reads through the sale business, branch and creator', async () => {
    await repository.findAllForBusiness(10, {
      allowedBranchIds: [20],
      createdByUserId: 7,
    });
    const [sql, values] = query.mock.calls[0];
    expect(sql).toContain('INNER JOIN sale s ON s.id = p.sale_id');
    expect(sql).toContain('s.business_id = $1');
    expect(sql).toContain('s.branch_id = ANY($2::bigint[])');
    expect(sql).toContain('s.created_by = $3');
    expect(values).toEqual([10, [20], 7]);
  });

  it('locks the sale with the same tenant, branch and creator restrictions', async () => {
    const tx = repository.inTransaction({ query } as unknown as PoolClient, {
      businessId: 10,
      userId: 7,
      filter: { allowedBranchIds: [], createdByUserId: 7 },
    });
    await tx.lockTarget({ sale_id: 3 });
    const [sql, values] = query.mock.calls[0];
    expect(sql).toContain('s.business_id = $1');
    expect(sql).toContain('s.branch_id = ANY($2::bigint[])');
    expect(sql).toContain('s.created_by = $3');
    expect(sql).toContain('s.id = $4 FOR UPDATE OF s');
    expect(values).toEqual([10, [], 7, 3]);
  });
});
