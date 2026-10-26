import { AuthorizationScopeService } from '../../auth/authorization-scope.service';
import { User } from '../../users/entities/user.entity';
import { CustomersRepository } from '../customers.repository';
import { CustomersService } from '../customers.service';

const user = {
  authorization: {
    userId: 7,
    businessId: 10,
    branchIds: [20],
    roles: [],
    permissions: { 'customer.manage': 'business' },
    isSuperadmin: false,
  },
} as User;

describe('CustomersService without booking data', () => {
  const repository = {
    findByIdForBusiness: jest.fn(),
    findPageForBusiness: jest.fn(),
    findByPhonesForBusiness: jest.fn(),
    updateForBusiness: jest.fn(),
  };
  const service = new CustomersService(
    repository as unknown as CustomersRepository,
    new AuthorizationScopeService(),
  );
  beforeEach(() => jest.resetAllMocks());

  it('rejects cross-tenant access before querying customers', async () => {
    await expect(service.findOneForBusiness(3, user, 11)).rejects.toThrow(
      'Cannot access another business',
    );
    expect(repository.findByIdForBusiness).not.toHaveBeenCalled();
  });

  it('reads customer details only within the authenticated business', async () => {
    repository.findByIdForBusiness.mockResolvedValue({
      id: 3,
      business_id: 10,
    });
    await expect(service.findOneForBusiness(3, user)).resolves.toEqual({
      id: 3,
      business_id: 10,
    });
    expect(repository.findByIdForBusiness).toHaveBeenCalledWith(3, 10);
  });

  it('normalizes phones before updating a customer', async () => {
    repository.findByPhonesForBusiness.mockResolvedValue(null);
    repository.updateForBusiness.mockResolvedValue({ id: 3 });
    await service.updateForBusiness(3, { phone: '+5493534133580' }, user);
    expect(repository.updateForBusiness).toHaveBeenCalledWith(3, 10, {
      phone: '543534133580',
    });
  });

  it('preserves pagination totals on an empty page', async () => {
    repository.findPageForBusiness.mockResolvedValue({ data: [], total: 4 });
    await expect(
      service.findAllForBusiness(user, undefined, 2, 10),
    ).resolves.toMatchObject({ pagination: { total: 4, totalPages: 1 } });
  });

  it('denies unsupported own scope instead of consulting removed conversation tables', async () => {
    await expect(
      service.findOneForBusiness(3, {
        authorization: {
          ...user.authorization!,
          permissions: { 'customer.manage': 'own' },
        },
      } as User),
    ).rejects.toThrow('Own customer scope is not supported');
    expect(repository.findByIdForBusiness).not.toHaveBeenCalled();
  });
});
