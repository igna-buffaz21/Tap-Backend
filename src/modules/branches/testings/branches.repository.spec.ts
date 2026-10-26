import { DatabaseService } from '../../../database/database.service';
import { BranchesRepository } from '../branches.repository';

describe('BranchesRepository branch_type persistence', () => {
  const database = { query: jest.fn() };
  const repository = new BranchesRepository(
    database as unknown as DatabaseService,
  );

  beforeEach(() => {
    database.query.mockReset();
    database.query.mockResolvedValue({
      rows: [
        {
          id: 20,
          branch_type: 'PADEL',
          lat: null,
          lng: null,
          opening_hours: null,
        },
      ],
    });
  });

  it('includes the type in the matching INSERT parameter', async () => {
    await expect(
      repository.create({
        business_id: 10,
        name: 'Centro',
        slug: 'centro',
        branch_type: 'PADEL',
      }),
    ).resolves.toMatchObject({ branch_type: 'PADEL' });

    const [sql, values] = database.query.mock.calls[0];
    const columns = sql
      .match(/INSERT INTO branch\s*\(([^)]+)\)/)[1]
      .split(',')
      .map((column: string) => column.trim());
    expect(values[columns.indexOf('branch_type')]).toBe('PADEL');
    expect(values[columns.indexOf('business_id')]).toBe(10);
    expect(values).toHaveLength(columns.length);
  });

  it.each(['SOCCER', null] as const)(
    'persists type %s while retaining the business filter',
    async (branchType) => {
      await repository.update(20, { branch_type: branchType }, 10);

      const [sql, values] = database.query.mock.calls[0];
      expect(sql).toContain('branch_type = $1');
      expect(sql).toContain('WHERE id = $2 AND business_id = $3');
      expect(values).toEqual([branchType, 20, 10]);
    },
  );

  it.each(['SOCCER', null, undefined] as const)(
    'includes branch_type %s in detail for superadmin and business reads',
    async (branchType) => {
      database.query.mockResolvedValue({
        rows: [
          {
            id: 20,
            business_id: 10,
            name: 'Planeta Gol',
            branch_type: branchType,
            lat: null,
            lng: null,
            opening_hours: null,
          },
        ],
      });

      await expect(repository.findById(20)).resolves.toMatchObject({
        id: 20,
        branch_type: branchType ?? null,
      });
      await expect(
        repository.findByIdForBusiness(20, 10, [20]),
      ).resolves.toMatchObject({
        id: 20,
        branch_type: branchType ?? null,
      });

      const [sql, values] = database.query.mock.calls[1];
      expect(sql).toContain('business_id = $2');
      expect(sql).toContain('id = ANY($3::bigint[])');
      expect(values).toEqual([20, 10, [20]]);
    },
  );
});
