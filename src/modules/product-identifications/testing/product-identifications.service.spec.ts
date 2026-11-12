import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { ProductIdentificationsRepository } from '../product-identifications.repository';
import { ProductIdentificationsService } from '../product-identifications.service';
import { CreateProductIdentificationDto } from '../types/dto/create-product-identification.dto';
import { UpdateProductIdentificationDto } from '../types/dto/update-product-identification.dto';

describe('ProductIdentificationsService', () => {
  const user = {
    business_id: 999,
    authorization: { businessId: 7 },
  } as User;
  const dto: CreateProductIdentificationDto = {
    product_id: 12,
    type: 'RFID_UHF',
    value: '00000001',
  };
  const identification = { id: '3', business_id: '7', ...dto };
  let repository: {
    createForBusiness: jest.Mock;
    findAllForBusiness: jest.Mock;
    findByIdForBusiness: jest.Mock;
    updateForBusiness: jest.Mock;
    removeForBusiness: jest.Mock;
    findProductsByRfidValuesForBusiness: jest.Mock;
  };
  let service: ProductIdentificationsService;

  beforeEach(() => {
    repository = {
      createForBusiness: jest.fn().mockResolvedValue(identification),
      findAllForBusiness: jest.fn().mockResolvedValue([identification]),
      findByIdForBusiness: jest.fn().mockResolvedValue(identification),
      updateForBusiness: jest.fn().mockResolvedValue(identification),
      removeForBusiness: jest.fn().mockResolvedValue(true),
      findProductsByRfidValuesForBusiness: jest.fn().mockResolvedValue([]),
    };
    service = new ProductIdentificationsService(
      repository as unknown as ProductIdentificationsRepository,
    );
  });

  describe('RFID product flow', () => {
    const epc = 'CAFE00000001000000000002';
    const otherUnit = 'CAFE00000001000000000003';
    const product = {
      id: '12',
      business_id: '7',
      category_id: null,
      name: 'Café',
      description: 'Café molido',
      sku: 'CAFE-01',
      unit: 'unit',
      sale_price: '2500.0000',
      cost_price: '1800.0000',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('resolves full product information using the product code and authorized business, retaining each unit EPC', async () => {
      repository.findProductsByRfidValuesForBusiness.mockResolvedValue([
        { ...product, identification_value: '00000001' },
      ]);
      const scan = jest
        .fn()
        .mockResolvedValue({
          epcs: [epc, otherUnit, epc],
          total: 3,
          door: 'open',
        });
      await expect(
        service.resolveRfidFlowForBusiness(user, scan),
      ).resolves.toEqual({
        products: [
          { epc, product },
          { epc: otherUnit, product },
        ],
        total: 2,
        door: 'open',
      });
      expect(
        repository.findProductsByRfidValuesForBusiness,
      ).toHaveBeenCalledTimes(1);
      expect(
        repository.findProductsByRfidValuesForBusiness,
      ).toHaveBeenCalledWith(7, ['00000001']);
    });

    it('maps multiple product codes correctly regardless of database row ordering', async () => {
      const secondEpc = 'CAFE00000002000000000001';
      const secondProduct = { ...product, id: '15', name: 'Té' };
      repository.findProductsByRfidValuesForBusiness.mockResolvedValue([
        { ...secondProduct, identification_value: '00000002' },
        { ...product, identification_value: '00000001' },
      ]);
      await expect(
        service.resolveRfidFlowForBusiness(user, async () => ({
          epcs: [epc, secondEpc],
          total: 2,
          door: 'open',
        })),
      ).resolves.toEqual({
        products: [
          { epc, product },
          { epc: secondEpc, product: secondProduct },
        ],
        total: 2,
        door: 'open',
      });
    });

    it('returns null for unknown or other-tenant identifiers without discarding their EPCs', async () => {
      await expect(
        service.resolveRfidFlowForBusiness(user, async () => ({
          epcs: [epc],
          total: 1,
          door: 'open',
        })),
      ).resolves.toEqual({
        products: [{ epc, product: null }],
        total: 1,
        door: 'open',
      });
      expect(
        repository.findProductsByRfidValuesForBusiness,
      ).toHaveBeenCalledWith(7, ['00000001']);
    });

    it('canonicalizes the product code but retains the exact full EPC', async () => {
      const lowercaseEpc = 'cafe00abcdef000000000001';
      repository.findProductsByRfidValuesForBusiness.mockResolvedValue([
        { ...product, identification_value: '00ABCDEF' },
      ]);
      await expect(
        service.resolveRfidFlowForBusiness(user, async () => ({
          epcs: [lowercaseEpc],
          total: 1,
          door: 'open',
        })),
      ).resolves.toEqual({
        products: [{ epc: lowercaseEpc, product }],
        total: 1,
        door: 'open',
      });
      expect(
        repository.findProductsByRfidValuesForBusiness,
      ).toHaveBeenCalledWith(7, ['00ABCDEF']);
    });

    it.each([
      { epcs: [] },
      { epcs: ['BAD', '00000001', 'CAFE0000000100000000000Z'] },
    ])(
      'avoids database access when no full EPC has the expected format: %j',
      async ({ epcs }) => {
        const result = await service.resolveRfidFlowForBusiness(
          user,
          async () => ({ epcs, total: epcs.length, door: 'open' }),
        );
        expect(result).toEqual({
          products: epcs.map((value) => ({ epc: value, product: null })),
          total: epcs.length,
          door: 'open',
        });
        expect(
          repository.findProductsByRfidValuesForBusiness,
        ).not.toHaveBeenCalled();
      },
    );

    it.each([
      undefined,
      { business_id: 7 },
      { authorization: { businessId: null } },
      { authorization: { businessId: 0 } },
    ])(
      'rejects missing authorization before the physical flow runs',
      async (unauthorized) => {
        const scan = jest.fn();
        await expect(
          service.resolveRfidFlowForBusiness(unauthorized as User, scan),
        ).rejects.toBeInstanceOf(ForbiddenException);
        expect(scan).not.toHaveBeenCalled();
        expect(
          repository.findProductsByRfidValuesForBusiness,
        ).not.toHaveBeenCalled();
      },
    );

    it('does not query products after a failed hardware flow', async () => {
      const error = new Error('Door ACK failed');
      await expect(
        service.resolveRfidFlowForBusiness(user, async () => {
          throw error;
        }),
      ).rejects.toBe(error);
      expect(
        repository.findProductsByRfidValuesForBusiness,
      ).not.toHaveBeenCalled();
    });

    it('does not return an incomplete result when the database query fails', async () => {
      const error = new Error('Database unavailable');
      repository.findProductsByRfidValuesForBusiness.mockRejectedValue(error);
      await expect(
        service.resolveRfidFlowForBusiness(user, async () => ({
          epcs: [epc],
          total: 1,
          door: 'open',
        })),
      ).rejects.toBe(error);
    });
  });

  it('assigns using the authorized business, ignoring business IDs supplied in the body or user record', async () => {
    await expect(
      service.createForBusiness(
        { ...dto, business_id: 99 } as CreateProductIdentificationDto,
        user,
      ),
    ).resolves.toEqual(identification);
    expect(repository.createForBusiness).toHaveBeenCalledWith(7, dto);
  });

  it.each(['create', 'list', 'get', 'update', 'delete'])(
    'rejects %s without an authorized business before accessing persistence',
    async (operation) => {
      const unauthorized = { business_id: 7 } as User;
      const execute = () => {
        switch (operation) {
          case 'create':
            return service.createForBusiness(dto, unauthorized);
          case 'list':
            return service.findAllForBusiness({}, unauthorized);
          case 'get':
            return service.findOneForBusiness(3, unauthorized);
          case 'update':
            return service.updateForBusiness(
              3,
              { value: '00000002' },
              unauthorized,
            );
          default:
            return service.removeForBusiness(3, unauthorized);
        }
      };
      await expect(Promise.resolve().then(execute)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      for (const method of Object.values(repository))
        expect(method).not.toHaveBeenCalled();
    },
  );

  it('normalizes type and surrounding whitespace while preserving identifier case and leading zeroes', async () => {
    await service.createForBusiness(
      { ...dto, type: ' ean_13 ' as typeof dto.type, value: ' 0012345678905 ' },
      user,
    );
    expect(repository.createForBusiness).toHaveBeenCalledWith(7, {
      product_id: 12,
      type: 'EAN_13',
      value: '0012345678905',
    });
    await service.createForBusiness(
      { ...dto, type: 'QR', value: ' CaseSensitive ' },
      user,
    );
    expect(repository.createForBusiness).toHaveBeenLastCalledWith(7, {
      ...dto,
      type: 'QR',
      value: 'CaseSensitive',
    });
  });

  it.each([
    ['CAFE00000001000000000002', '00000001'],
    ['CAFE00000001000000000003', '00000001'],
    ['BEEF00000001000000000002', '00000001'],
    [' cafe00abcdef000000000002 ', '00ABCDEF'],
    [' 00abcdef ', '00ABCDEF'],
    ['00000001', '00000001'],
  ])('stores only the product code from RFID %s', async (value, expected) => {
    await service.createForBusiness({ ...dto, value }, user);
    expect(repository.createForBusiness).toHaveBeenCalledWith(7, {
      ...dto,
      value: expected,
    });
  });

  it.each([
    '0001',
    'CAFE0000000100000000000',
    'CAFE000000010000000000002',
    'CAFE0000000100000000000Z',
    '0000000Z',
  ])('rejects malformed RFID values: %s', async (value) => {
    await expect(
      service.createForBusiness({ ...dto, value }, user),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.createForBusiness).not.toHaveBeenCalled();
  });

  it('normalizes full EPC lookup filters when RFID_UHF is specified', async () => {
    await service.findAllForBusiness(
      { type: 'RFID_UHF', value: 'CAFE00000001000000000002' },
      user,
    );
    expect(repository.findAllForBusiness).toHaveBeenCalledWith(7, {
      type: 'RFID_UHF',
      value: '00000001',
      product_id: undefined,
    });
  });

  it('keeps full EPC-shaped QR values and untyped exact lookup filters unchanged', async () => {
    const value = 'CAFE00000001000000000002';
    await service.createForBusiness({ ...dto, type: 'QR', value }, user);
    expect(repository.createForBusiness).toHaveBeenCalledWith(7, {
      ...dto,
      type: 'QR',
      value,
    });
    await service.findAllForBusiness({ value }, user);
    expect(repository.findAllForBusiness).toHaveBeenCalledWith(7, {
      value,
      type: undefined,
      product_id: undefined,
    });
  });

  it('uses the current type when editing only the value', async () => {
    await service.updateForBusiness(
      3,
      { value: 'CAFE00000001000000000002' },
      user,
    );
    expect(repository.updateForBusiness).toHaveBeenCalledWith(
      3,
      7,
      { product_id: undefined, type: undefined, value: '00000001' },
      identification,
    );
  });

  it('normalizes the retained value when changing the type to RFID_UHF', async () => {
    const current = {
      ...identification,
      type: 'QR',
      value: 'CAFE00000001000000000002',
    };
    repository.findByIdForBusiness.mockResolvedValue(current);
    await service.updateForBusiness(3, { type: 'RFID_UHF' }, user);
    expect(repository.updateForBusiness).toHaveBeenCalledWith(
      3,
      7,
      { product_id: undefined, type: 'RFID_UHF', value: '00000001' },
      current,
    );
  });

  it('rejects a type change when the retained value is not a valid RFID product code', async () => {
    repository.findByIdForBusiness.mockResolvedValue({
      ...identification,
      type: 'QR',
      value: 'https://example.com/product',
    });
    await expect(
      service.updateForBusiness(3, { type: 'RFID_UHF' }, user),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.updateForBusiness).not.toHaveBeenCalled();
  });

  it('retains QR value semantics for a value-only edit', async () => {
    const current = { ...identification, type: 'QR', value: 'old' };
    repository.findByIdForBusiness.mockResolvedValue(current);
    const value = 'CAFE00000001000000000002';
    await service.updateForBusiness(3, { value }, user);
    expect(repository.updateForBusiness).toHaveBeenCalledWith(
      3,
      7,
      { product_id: undefined, type: undefined, value },
      current,
    );
  });

  it('normalizes different serials to the same unique product identifier before returning a conflict', async () => {
    await service.createForBusiness(
      { ...dto, value: 'CAFE00000001000000000002' },
      user,
    );
    repository.createForBusiness.mockRejectedValueOnce({
      code: '23505',
      constraint: 'uq_product_identification',
    });
    await expect(
      service.createForBusiness(
        { ...dto, product_id: 15, value: 'CAFE00000001000000000003' },
        user,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.createForBusiness).toHaveBeenNthCalledWith(1, 7, dto);
    expect(repository.createForBusiness).toHaveBeenNthCalledWith(2, 7, {
      ...dto,
      product_id: 15,
    });
  });

  it.each(['RFID_UHF', 'EAN_13', 'QR'] as const)(
    'reports duplicate %s identifiers on creation and editing',
    async (type) => {
      const duplicate = {
        code: '23505',
        constraint: 'uq_product_identification',
      };
      repository.createForBusiness.mockRejectedValueOnce(duplicate);
      repository.updateForBusiness.mockRejectedValueOnce(duplicate);
      await expect(
        service.createForBusiness({ ...dto, type }, user),
      ).rejects.toBeInstanceOf(ConflictException);
      await expect(
        service.updateForBusiness(3, { type, value: dto.value }, user),
      ).rejects.toBeInstanceOf(ConflictException);
    },
  );

  it('returns 404 without editing when the identifier is outside the authorized business', async () => {
    repository.findByIdForBusiness.mockResolvedValue(null);
    await expect(
      service.updateForBusiness(3, { value: '00000002' }, user),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.updateForBusiness).not.toHaveBeenCalled();
  });

  it('reports a concurrent type or value change without overwriting it with stale normalization', async () => {
    repository.findByIdForBusiness
      .mockResolvedValueOnce(identification)
      .mockResolvedValueOnce({ ...identification, type: 'QR', value: 'new' });
    repository.updateForBusiness.mockResolvedValue(null);
    await expect(
      service.updateForBusiness(3, { value: '00000002' }, user),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it.each([
    { product_id: null },
    { product_id: true },
    { product_id: 0 },
    { product_id: 1.5 },
    { product_id: Number.MAX_SAFE_INTEGER + 1 },
    { type: 'UNKNOWN' },
    { type: null },
    { value: '' },
    { value: '  ' },
    { value: null },
    { value: 123 },
    { value: 'a'.repeat(256) },
  ])('rejects invalid assignment fields: %j', async (invalid) => {
    await expect(
      service.createForBusiness(
        { ...dto, ...invalid } as CreateProductIdentificationDto,
        user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.createForBusiness).not.toHaveBeenCalled();
  });

  it('returns 404 when the assigned product is missing or belongs to another business', async () => {
    repository.createForBusiness.mockResolvedValue(null);
    await expect(service.createForBusiness(dto, user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('supports exact lookup filters and scopes them to the authorized business', async () => {
    await expect(
      service.findAllForBusiness(
        {
          product_id: '12',
          type: 'qr',
          value: ' AbC ',
        } as unknown as CreateProductIdentificationDto,
        user,
      ),
    ).resolves.toEqual([identification]);
    expect(repository.findAllForBusiness).toHaveBeenCalledWith(7, {
      product_id: 12,
      type: 'QR',
      value: 'AbC',
    });
  });

  it('lists all identifiers when no filters are supplied', async () => {
    await service.findAllForBusiness({}, user);
    expect(repository.findAllForBusiness).toHaveBeenCalledWith(7, {
      product_id: undefined,
      type: undefined,
      value: undefined,
    });
  });

  it('rejects malformed list filters before querying', () => {
    expect(() =>
      service.findAllForBusiness(
        { value: ['a', 'b'] } as unknown as CreateProductIdentificationDto,
        user,
      ),
    ).toThrow(BadRequestException);
    expect(repository.findAllForBusiness).not.toHaveBeenCalled();
  });

  it('gets and deletes only within the authorized business', async () => {
    await expect(service.findOneForBusiness('3', user)).resolves.toEqual(
      identification,
    );
    await expect(service.removeForBusiness('3', user)).resolves.toBeUndefined();
    expect(repository.findByIdForBusiness).toHaveBeenCalledWith(3, 7);
    expect(repository.removeForBusiness).toHaveBeenCalledWith(3, 7);
  });

  it('returns 404 for inaccessible reads and deletions', async () => {
    repository.findByIdForBusiness.mockResolvedValue(null);
    repository.removeForBusiness.mockResolvedValue(false);
    await expect(service.findOneForBusiness(3, user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.removeForBusiness(3, user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('supports partial edits and reassignment without allowing tenant changes', async () => {
    await service.updateForBusiness(
      3,
      {
        value: ' 00000002 ',
        business_id: 99,
      } as UpdateProductIdentificationDto,
      user,
    );
    expect(repository.updateForBusiness).toHaveBeenCalledWith(
      3,
      7,
      {
        value: '00000002',
        product_id: undefined,
        type: undefined,
      },
      identification,
    );
    await service.updateForBusiness(3, { product_id: 15 }, user);
    expect(repository.updateForBusiness).toHaveBeenLastCalledWith(
      3,
      7,
      {
        product_id: 15,
        type: undefined,
        value: '00000001',
      },
      identification,
    );
  });

  it.each([
    {},
    { business_id: 99 },
    { value: null },
    { product_id: null },
    { type: null },
    null,
    [],
  ])('rejects empty or invalid edits: %j', async (invalid) => {
    await expect(
      service.updateForBusiness(
        3,
        invalid as UpdateProductIdentificationDto,
        user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.updateForBusiness).not.toHaveBeenCalled();
  });

  it('returns 404 when editing another tenant identification or assigning another tenant product', async () => {
    repository.updateForBusiness.mockResolvedValue(null);
    await expect(
      service.updateForBusiness(3, { product_id: 99 }, user),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it.each(['create', 'update'])(
    'maps duplicate identifiers to 409 during %s and propagates other database errors',
    async (operation) => {
      const method =
        operation === 'create'
          ? repository.createForBusiness
          : repository.updateForBusiness;
      const execute = () =>
        operation === 'create'
          ? service.createForBusiness(dto, user)
          : service.updateForBusiness(3, dto, user);
      method.mockRejectedValueOnce({
        code: '23505',
        constraint: 'uq_product_identification',
      });
      await expect(execute()).rejects.toBeInstanceOf(ConflictException);
      const error = new Error('database unavailable');
      method.mockRejectedValueOnce(error);
      await expect(execute()).rejects.toBe(error);
    },
  );

  it.each(['0', '-1', '1.5', '1e2', '0x10', ' ', '9007199254740992'])(
    'rejects invalid path id %j before reading, editing or deleting',
    async (id) => {
      await expect(service.findOneForBusiness(id, user)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(
        service.updateForBusiness(id, { value: '00000002' }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.removeForBusiness(id, user)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      for (const method of Object.values(repository))
        expect(method).not.toHaveBeenCalled();
    },
  );
});
