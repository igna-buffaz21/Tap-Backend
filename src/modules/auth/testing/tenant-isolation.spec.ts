import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthorizationScopeService } from '../authorization-scope.service';
import { AuthService } from '../auth.service';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { BusinessesService } from '../../businesses/businesses.service';
import { BusinessesRepository } from '../../businesses/businesses.repository';
import { UsersService } from '../../users/users.service';
import { UsersRepository } from '../../users/users.repository';
import { User } from '../../users/entities/user.entity';
import { ProductsService } from '../../products/products.service';
import { ProductsRepository } from '../../products/products.repository';
import { ProductCategoriesService } from '../../product-categories/product-categories.service';
import { ProductCategoriesRepository } from '../../product-categories/product-categories.repository';
import { ProductStocksService } from '../../product-stocks/product-stocks.service';
import { ProductStocksRepository } from '../../product-stocks/product-stocks.repository';
import { StockMovementsService } from '../../stock-movements/stock-movements.service';
import { StockMovementsRepository } from '../../stock-movements/stock-movements.repository';

const user = {
  id: 7,
  role: 'SUPERADMIN',
  authorization: { userId: 7, businessId: 10, branchIds: [], roles: [] },
} as unknown as User;

describe('Business isolation without permission grants', () => {
  it.each(['params', 'query', 'body'])(
    'rejects cross-tenant business hints from %s even with cached authentication',
    async (source) => {
      const authService = { authenticate: jest.fn() };
      const guard = new ClerkAuthGuard(
        authService as unknown as AuthService,
        new Reflector(),
      );
      const request = {
        auth: { authorization: user.authorization },
        headers: {},
        params: {},
        query: {},
        body: {},
        [source]: { business_id: 11 },
      };
      const context = {
        getHandler: () => AuthService.prototype.authenticate,
        getClass: () => AuthService,
        switchToHttp: () => ({ getRequest: () => request }),
      } as unknown as ExecutionContext;
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Cannot access another business',
      );
      expect(authService.authenticate).not.toHaveBeenCalled();
    },
  );

  it('lists only the authenticated business and rejects foreign business reads and updates', async () => {
    const repository = {
      findById: jest.fn().mockResolvedValue({ id: 10 }),
      update: jest.fn(),
    };
    const service = new BusinessesService(
      repository as unknown as BusinessesRepository,
      new AuthorizationScopeService(),
    );
    await expect(service.findAll(user)).resolves.toEqual([{ id: 10 }]);
    expect(repository.findById).toHaveBeenCalledWith(10);
    repository.findById.mockClear();
    expect(() => service.findOne(11, user)).toThrow(ForbiddenException);
    expect(() => service.update(11, { name: 'Other' }, user)).toThrow(
      ForbiddenException,
    );
    expect(repository.findById).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('scopes user reads, updates and deletions to the business without branch grants', async () => {
    const repository = {
      findAllForBusiness: jest.fn().mockResolvedValue([]),
      findByIdForBusiness: jest.fn().mockResolvedValue(null),
      updateForBusiness: jest.fn().mockResolvedValue(null),
      removeForBusiness: jest.fn().mockResolvedValue(false),
    };
    const service = new UsersService(repository as unknown as UsersRepository);
    await expect(service.findAll(user)).resolves.toEqual([]);
    await expect(service.findOne(99, user)).resolves.toBeNull();
    await expect(
      service.update(99, { name: 'Name' }, user),
    ).resolves.toBeNull();
    await expect(service.remove(99, user)).resolves.toBe(false);
    expect(repository.findAllForBusiness).toHaveBeenCalledWith(10, undefined);
    expect(repository.findByIdForBusiness).toHaveBeenCalledWith(99, 10);
    expect(repository.updateForBusiness).toHaveBeenCalledWith(99, 10, {
      name: 'Name',
      business_id: 10,
    });
    expect(repository.removeForBusiness).toHaveBeenCalledWith(99, 10);
  });

  it('rejects foreign businesses and branches when creating or updating users', async () => {
    const repository = {
      create: jest.fn(),
      updateForBusiness: jest.fn(),
      branchBelongsToBusiness: jest.fn().mockResolvedValue(false),
    };
    const service = new UsersService(repository as unknown as UsersRepository);
    await expect(
      service.create({ clerk_id: 'user_new', business_id: 11 }, user),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.create({ clerk_id: 'user_new', branch_id: 21 }, user),
    ).rejects.toThrow('Branch does not belong to business');
    await expect(service.update(8, { business_id: 11 }, user)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(service.update(8, { branch_id: 21 }, user)).rejects.toThrow(
      'Branch does not belong to business',
    );
    expect(repository.branchBelongsToBusiness).toHaveBeenCalledWith(21, 10);
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.updateForBusiness).not.toHaveBeenCalled();
  });

  it.each(['products', 'categories', 'stocks', 'movements'])(
    'reads %s within the business and returns 404 for foreign resources',
    async (resource) => {
      const repository = {
        findByIdForBusiness: jest
          .fn()
          .mockResolvedValue({ id: 3, business_id: 10 }),
      };
      const services = {
        products: new ProductsService(
          repository as unknown as ProductsRepository,
        ),
        categories: new ProductCategoriesService(
          repository as unknown as ProductCategoriesRepository,
        ),
        stocks: new ProductStocksService(
          repository as unknown as ProductStocksRepository,
        ),
        movements: new StockMovementsService(
          repository as unknown as StockMovementsRepository,
        ),
      };
      const service = services[resource];
      await expect(service.findOneForBusiness(3, user)).resolves.toEqual({
        id: 3,
        business_id: 10,
      });
      expect(repository.findByIdForBusiness.mock.calls[0].slice(0, 2)).toEqual([
        3, 10,
      ]);
      repository.findByIdForBusiness.mockResolvedValue(null);
      await expect(service.findOneForBusiness(99, user)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.findByIdForBusiness.mock.calls[1].slice(0, 2)).toEqual([
        99, 10,
      ]);
    },
  );

  it('rejects a foreign branch when filtering stock', async () => {
    const repository = {
      branchBelongsToBusinessAndAccess: jest.fn().mockResolvedValue(false),
      findAllForBusiness: jest.fn(),
    };
    const service = new ProductStocksService(
      repository as unknown as ProductStocksRepository,
    );
    await expect(service.findAllForBusiness(user, 21)).rejects.toThrow(
      'Branch does not belong to business',
    );
    expect(repository.branchBelongsToBusinessAndAccess).toHaveBeenCalledWith(
      21,
      10,
      undefined,
    );
    expect(repository.findAllForBusiness).not.toHaveBeenCalled();
  });
});
