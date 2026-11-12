import { DatabaseService } from '../../../database/database.service';
import { ProductIdentificationsRepository } from '../product-identifications.repository';

describe('ProductIdentificationsRepository tenant boundaries', () => {
  let query: jest.Mock;
  let repository: ProductIdentificationsRepository;

  beforeEach(() => {
    query = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
    repository = new ProductIdentificationsRepository({
      query,
    } as unknown as DatabaseService);
  });

  it('resolves RFID product codes in one parameterized query scoped to both product and identification ownership', async () => {
    await expect(
      repository.findProductsByRfidValuesForBusiness(7, [
        '00000001',
        '00000002',
      ]),
    ).resolves.toEqual([]);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, values] = query.mock.calls[0];
    expect(sql).toContain('SELECT i.value AS identification_value, p.*');
    expect(sql).toContain(
      'p.id = i.product_id AND p.business_id = i.business_id',
    );
    expect(sql).toContain("i.business_id = $1 AND i.type = 'RFID_UHF'");
    expect(sql).toContain('i.value = ANY($2::varchar[])');
    expect(values).toEqual([7, ['00000001', '00000002']]);
  });

  it('checks product ownership atomically when assigning and parameterizes the identifier', async () => {
    const value = "QR'; DELETE FROM product; --";
    await expect(
      repository.createForBusiness(7, { product_id: 12, type: 'QR', value }),
    ).resolves.toBeNull();
    const [sql, values] = query.mock.calls[0];
    expect(sql).toContain('SELECT p.business_id, p.id, $3, $4');
    expect(sql).toContain('WHERE p.business_id = $1 AND p.id = $2');
    expect(sql).not.toContain(value);
    expect(values).toEqual([7, 12, 'QR', value]);
  });

  it.each(['list', 'get', 'delete'])(
    'validates both identification and product ownership for %s',
    async (operation) => {
      if (operation === 'list') await repository.findAllForBusiness(7, {});
      else if (operation === 'get') await repository.findByIdForBusiness(3, 7);
      else await repository.removeForBusiness(3, 7);
      const [sql, values] = query.mock.calls[0];
      expect(sql).toContain(
        'p.id = i.product_id AND p.business_id = i.business_id',
      );
      expect(sql).toContain(
        operation === 'list'
          ? 'i.business_id = $1'
          : 'i.id = $1 AND i.business_id = $2',
      );
      expect(values).toEqual(
        operation === 'list' ? [7, null, null, null] : [3, 7],
      );
    },
  );

  it('checks current and destination products belong to the authorized business in a single update', async () => {
    await expect(
      repository.updateForBusiness(
        3,
        7,
        { product_id: 15 },
        { type: 'RFID_UHF', value: '00000001' },
      ),
    ).resolves.toBeNull();
    const [sql, values] = query.mock.calls[0];
    expect(sql).toContain('i.id = $1 AND i.business_id = $2');
    expect(sql).toContain(
      'p.id = i.product_id AND p.business_id = i.business_id',
    );
    expect(sql).toContain('target.id = COALESCE($3::bigint, i.product_id)');
    expect(sql).toContain('target.business_id = $2');
    expect(sql).toContain('i.type = $6 AND i.value = $7');
    expect(values).toEqual([3, 7, 15, null, null, 'RFID_UHF', '00000001']);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('uses exact parameterized lookup filters within the business', async () => {
    await repository.findAllForBusiness(7, {
      product_id: 12,
      type: 'QR',
      value: 'AbC',
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('i.value = $4'),
      [7, 12, 'QR', 'AbC'],
    );
  });

  it('reports a missing deletion without claiming success', async () => {
    await expect(repository.removeForBusiness(3, 7)).resolves.toBe(false);
    query.mockResolvedValueOnce({ rows: [{ id: '3' }], rowCount: 1 });
    await expect(repository.removeForBusiness(3, 7)).resolves.toBe(true);
  });
});
