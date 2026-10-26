import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { User } from '../../users/entities/user.entity';
import { BranchesService } from '../branches.service';
import { BRANCH_TYPES } from '../entities/branch.entity';

describe('BranchesService update permissions', () => {
  const branchesRepository = {
    create: jest.fn(),
    adminCanManageBranch: jest.fn(),
    findById: jest.fn(),
    findByIdForBusiness: jest.fn(),
    update: jest.fn(),
  };
  const configService = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        CLOUDINARY_CLOUD_NAME: 'demo',
        CLOUDINARY_API_KEY: '1234',
        CLOUDINARY_API_SECRET: 'abcd',
      };

      return values[key];
    }),
  };

  function createService(): BranchesService {
    return new BranchesService(
      branchesRepository as never,
      configService as unknown as ConfigService,
    );
  }

  function createUser(overrides: Partial<User> = {}): User {
    const role = overrides.role ?? 'admin';
    const businessId = overrides.business_id ?? 10;
    const isSuperadmin = role === 'superadmin';

    return {
      id: 5,
      clerk_id: 'clerk_123',
      business_id: 10,
      branch_id: 20,
      name: 'Admin',
      email: 'admin@example.com',
      photo_url: null,
      role: 'admin',
      status: 'active',
      created_at: new Date('2026-08-25T00:00:00.000Z'),
      updated_at: new Date('2026-08-25T00:00:00.000Z'),
      authorization: {
        userId: 5,
        businessId: isSuperadmin ? null : Number(businessId),
        branchIds: isSuperadmin ? [] : [20],
        roles: [
          {
            id: isSuperadmin ? 99 : 5,
            name: isSuperadmin ? 'Superadmin' : 'Encargado',
            status: 'active',
          },
        ],
        permissions: isSuperadmin
          ? {}
          : {
              'branch.manage': 'branch',
              'analytics.view': 'branch',
            },
        isSuperadmin,
      },
      ...overrides,
    };
  }

  beforeEach(() => {
    branchesRepository.create.mockReset();
    branchesRepository.adminCanManageBranch.mockReset();
    branchesRepository.findById.mockReset();
    branchesRepository.findByIdForBusiness.mockReset();
    branchesRepository.update.mockReset();
    configService.get.mockClear();
  });

  it.each([...BRANCH_TYPES, null, undefined])(
    'accepts branch_type %s on creation and update',
    async (branchType) => {
      const service = createService();
      const createDto = {
        business_id: 10,
        name: 'Centro',
        slug: 'centro',
        branch_type: branchType,
      };
      branchesRepository.create.mockResolvedValue({ id: 20 });
      branchesRepository.update.mockResolvedValue({ id: 20 });

      await service.createForBusiness(
        createDto,
        createUser({ role: 'superadmin', business_id: null, branch_id: null }),
      );
      expect(branchesRepository.create).toHaveBeenCalledWith({
        ...createDto,
        branch_type: branchType ?? null,
      });

      await service.update(20, { branch_type: branchType }, createUser());
      expect(branchesRepository.update).toHaveBeenCalledWith(
        20,
        branchType === undefined ? {} : { branch_type: branchType },
        10,
      );
    },
  );

  it.each(['TENNIS', 'padel', '', 1, {}, []])(
    'rejects invalid branch_type %p before writing',
    async (branchType) => {
      const service = createService();
      expect(() =>
        service.createForBusiness(
          {
            business_id: 10,
            name: 'Centro',
            slug: 'centro',
            branch_type: branchType,
          } as never,
          createUser({ role: 'superadmin', business_id: null, branch_id: null }),
        ),
      ).toThrow(BadRequestException);
      await expect(
        service.update(
          20,
          { branch_type: branchType } as never,
          createUser(),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(branchesRepository.create).not.toHaveBeenCalled();
      expect(branchesRepository.update).not.toHaveBeenCalled();
    },
  );

  it('updates editable branch fields for an assigned admin branch', async () => {
    const service = createService();
    const user = createUser();

    branchesRepository.update.mockResolvedValue({ id: 20 });

    await service.update(
      20,
      {
        name: ' Centro ',
        slug: ' centro ',
        description: '',
        logo_url: ' https://example.com/logo.png ',
        lat: '-31.420083' as never,
        lng: -64.188776,
        opening_hours: {
          monday: [{ open: ' 08:00 ', close: '22:00' }],
          tuesday: [{ open: '08:00', close: '22:00' }],
          wednesday: [{ open: '08:00', close: '22:00' }],
          thursday: [{ open: '08:00', close: '22:00' }],
          friday: [{ open: '08:00', close: '22:00' }],
          saturday: [],
          sunday: [],
        },
      },
      user,
    );

    expect(branchesRepository.update).toHaveBeenCalledWith(
      20,
      {
        name: 'Centro',
        slug: 'centro',
        description: null,
        logo_url: 'https://example.com/logo.png',
        lat: -31.420083,
        lng: -64.188776,
        opening_hours: {
          monday: [{ open: '08:00', close: '22:00' }],
          tuesday: [{ open: '08:00', close: '22:00' }],
          wednesday: [{ open: '08:00', close: '22:00' }],
          thursday: [{ open: '08:00', close: '22:00' }],
          friday: [{ open: '08:00', close: '22:00' }],
          saturday: [],
          sunday: [],
        },
      },
      user.business_id,
    );
  });

  it('allows opening hours that close at midnight on the next day', async () => {
    const service = createService();
    const user = createUser();
    const openingHours = {
      monday: [{ open: '16:00', close: '00:00' }],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };

    branchesRepository.update.mockResolvedValue({ id: 20 });

    await service.update(20, { opening_hours: openingHours }, user);

    expect(branchesRepository.update).toHaveBeenCalledWith(
      20,
      { opening_hours: openingHours },
      user.business_id,
    );
  });

  it('allows clearing branch coordinates', async () => {
    const service = createService();
    const user = createUser();

    branchesRepository.update.mockResolvedValue({ id: 20 });

    await service.update(
      20,
      {
        lat: null,
        lng: '',
      } as never,
      user,
    );

    expect(branchesRepository.update).toHaveBeenCalledWith(
      20,
      {
        lat: null,
        lng: null,
      },
      user.business_id,
    );
  });

  it('rejects branch coordinates outside valid ranges', async () => {
    const service = createService();

    await expect(
      service.update(
        20,
        {
          lat: -91,
        },
        createUser({ role: 'superadmin', business_id: null, branch_id: null }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(branchesRepository.update).not.toHaveBeenCalled();
  });

  it('rejects invalid opening hours', async () => {
    const service = createService();

    await expect(
      service.update(
        20,
        {
          opening_hours: {
            monday: [{ open: '8:00', close: '22:00' }],
            tuesday: [{ open: '08:00', close: '22:00' }],
            wednesday: [{ open: '08:00', close: '22:00' }],
            thursday: [{ open: '08:00', close: '22:00' }],
            friday: [{ open: '08:00', close: '22:00' }],
            saturday: [],
            sunday: [],
          },
        },
        createUser({ role: 'superadmin', business_id: null, branch_id: null }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(branchesRepository.update).not.toHaveBeenCalled();
  });

  it('returns an assigned admin branch by id', async () => {
    const service = createService();
    const user = createUser();
    const branch = {
      id: 20,
      business_id: 10,
      name: 'Centro',
      slug: 'centro',
    };

    branchesRepository.findByIdForBusiness.mockResolvedValue(branch);

    await expect(service.findOne(20, user)).resolves.toBe(branch);
    expect(branchesRepository.findByIdForBusiness).toHaveBeenCalledWith(
      20,
      user.business_id,
      [20],
    );
    expect(branchesRepository.findById).not.toHaveBeenCalled();
  });

  it('rejects admin updates for branches not assigned to the admin', async () => {
    const service = createService();

    await expect(
      service.update(21, { name: 'Sur' }, createUser()),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(branchesRepository.update).not.toHaveBeenCalled();
  });

  it('allows business settings users to update an assigned branch', async () => {
    const service = createService();
    const user = createUser();

    user.authorization!.permissions = {
      'business.settings': 'branch',
    };
    branchesRepository.update.mockResolvedValue({ id: 20 });

    await service.update(20, { name: 'Centro' }, user);

    expect(branchesRepository.update).toHaveBeenCalledWith(
      20,
      { name: 'Centro' },
      user.business_id,
    );
  });

  it('rejects business settings users with own scope', async () => {
    const service = createService();
    const user = createUser();

    user.authorization!.permissions = {
      'business.settings': 'own',
    };

    await expect(
      service.update(20, { name: 'Centro' }, user),
    ).rejects.toThrow('Branch scope is required');
    expect(branchesRepository.update).not.toHaveBeenCalled();
  });

  it('rejects protected fields in the update payload', async () => {
    const service = createService();

    await expect(
      service.update(
        20,
        {
          name: 'Centro',
          status: 'inactive',
        } as never,
        createUser({ role: 'superadmin', business_id: null, branch_id: null }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(branchesRepository.adminCanManageBranch).not.toHaveBeenCalled();
    expect(branchesRepository.update).not.toHaveBeenCalled();
  });

  it('generates a signed Cloudinary upload payload for an assigned admin branch', async () => {
    const service = createService();
    const user = createUser();
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1315060510000);
    const publicId = 'turnero/branches/10/20/logo-centro-1315060510';
    const expectedSignature = createHash('sha1')
      .update(`public_id=${publicId}&timestamp=1315060510abcd`)
      .digest('hex');

    branchesRepository.findByIdForBusiness.mockResolvedValue({
      id: 20,
      business_id: 10,
      slug: 'centro',
    });

    await expect(
      service.createImageUploadSignature(20, { image_type: 'logo' }, user),
    ).resolves.toEqual({
      cloud_name: 'demo',
      api_key: '1234',
      upload_url: 'https://api.cloudinary.com/v1_1/demo/image/upload',
      resource_type: 'image',
      timestamp: 1315060510,
      public_id: publicId,
      signature: expectedSignature,
    });

    nowSpy.mockRestore();
  });

  it('allows business settings users to generate an upload signature for an assigned branch', async () => {
    const service = createService();
    const user = createUser();
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1315060510000);

    user.authorization!.permissions = {
      'business.settings': 'branch',
    };
    branchesRepository.findByIdForBusiness.mockResolvedValue({
      id: 20,
      business_id: 10,
      slug: 'centro',
    });

    await expect(
      service.createImageUploadSignature(20, { image_type: 'cover' }, user),
    ).resolves.toMatchObject({
      public_id: 'turnero/branches/10/20/cover-centro-1315060510',
    });

    expect(branchesRepository.findByIdForBusiness).toHaveBeenCalledWith(
      20,
      user.business_id,
    );
    nowSpy.mockRestore();
  });
});
