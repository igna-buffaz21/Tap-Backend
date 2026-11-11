import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AuthorizationScopeService } from '../../auth/authorization-scope.service';
import { User } from '../../users/entities/user.entity';
import { SalesRepository } from '../sales.repository';
import { SalesService } from '../sales.service';

describe('SalesService pagination', () => {
  const repository = { findAllForBusiness: jest.fn() };
  const service = new SalesService(
    repository as unknown as SalesRepository,
    new AuthorizationScopeService(),
  );
  const user = (): User =>
    ({
      authorization: {
        userId: 7,
        businessId: 1,
        branchIds: [2],
        roles: [],
      },
    }) as User;

  beforeEach(() => {
    repository.findAllForBusiness.mockReset().mockResolvedValue({
      sales: [],
      total: 0,
    });
  });

  it('defaults to page 1 with 10 sales and reports an empty history', async () => {
    await expect(service.findAllForBusiness(user())).resolves.toEqual({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });
    expect(repository.findAllForBusiness).toHaveBeenCalledWith(1, undefined, {
      limit: 10,
      offset: 0,
    });
  });

  it('computes the offset and rounds up total pages for a partial last page', async () => {
    const sales = [{ id: 15, status: 'CANCELLED' }];
    repository.findAllForBusiness.mockResolvedValue({ sales, total: 12 });

    await expect(
      service.findAllForBusiness(user(), undefined, '3', '5'),
    ).resolves.toEqual({
      data: sales,
      pagination: { page: 3, limit: 5, total: 12, totalPages: 3 },
    });
    expect(repository.findAllForBusiness).toHaveBeenCalledWith(1, undefined, {
      limit: 5,
      offset: 10,
    });
  });

  it('accepts the maximum page size', async () => {
    await service.findAllForBusiness(user(), undefined, '2', '100');
    expect(repository.findAllForBusiness).toHaveBeenCalledWith(1, undefined, {
      limit: 100,
      offset: 100,
    });
  });

  it.each([
    ['0', '10'],
    ['-1', '10'],
    ['1.5', '10'],
    ['abc', '10'],
    ['1', '0'],
    ['1', '-1'],
    ['1', '2.5'],
    ['1', 'abc'],
    ['1', '101'],
    ['9007199254740992', '1'],
    ['9007199254740991', '100'],
  ])(
    'rejects invalid pagination page=%s limit=%s before querying',
    async (page, limit) => {
      await expect(
        service.findAllForBusiness(user(), undefined, page, limit),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.findAllForBusiness).not.toHaveBeenCalled();
    },
  );

  it('allows business-wide requests without individual grants', async () => {
    const currentUser = user();

    await service.findAllForBusiness(currentUser, undefined, '2', '5');

    expect(repository.findAllForBusiness).toHaveBeenCalledWith(1, undefined, {
      limit: 5,
      offset: 5,
    });
  });

  it('rejects a request for another business before querying', async () => {
    await expect(
      service.findAllForBusiness(user(), '2', '1', '10'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.findAllForBusiness).not.toHaveBeenCalled();
  });

  it('does not elevate a user based on their legacy role', async () => {
    const currentUser = { ...user(), role: 'SUPERADMIN' };
    await expect(
      service.findAllForBusiness(currentUser, '3'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.findAllForBusiness).not.toHaveBeenCalled();
  });
});
