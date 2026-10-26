import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { clerkClient } from '@clerk/express';
import type { RolePermissionAccessScope } from '../auth/interfaces/auth-user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersRepository } from './users.repository';

interface ClerkUserProfile {
  name: string;
  email: string;
  photo_url: string | null;
}

interface NormalizedCreateUserDto extends CreateUserDto {
  role: string;
}

interface UserManageAccess {
  businessId: number;
  accessScope: RolePermissionAccessScope;
  branchIds: number[];
}

type UserResponse = Omit<User, 'role' | 'authorization'>;

const USER_READ_PERMISSIONS = ['user.read', 'user.manage'] as const;
const USER_MANAGE_PERMISSIONS = ['user.manage'] as const;

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto) {
    const dto = await this.normalizeCreateDto(createUserDto);

    try {
      return this.mapUserResponse(await this.usersRepository.create(dto));
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('User already exists');
      }

      throw error;
    }
  }

  async findAll(currentUser: User, branchIdValue?: unknown) {
    const branchId = this.normalizeOptionalPositiveInteger(
      branchIdValue,
      'branchId',
    );
    const authorization = currentUser.authorization;

    if (authorization?.isSuperadmin) {
      const users =
        branchId === undefined
          ? await this.usersRepository.findAll()
          : await this.usersRepository.findAllByBranch(branchId);

      return users.map((user) => this.mapUserResponse(user));
    }

    const access = this.resolveUserAccess(currentUser, USER_READ_PERMISSIONS);

    if (branchId !== undefined) {
      this.assertBranchAllowedForUserManageAccess(access, branchId);
      await this.assertBranchBelongsToBusiness(branchId, access.businessId);
    }

    const users = await this.usersRepository.findAllForBusiness(
      access.businessId,
      branchId,
      this.getAllowedBranchIdsForUserManageAccess(access),
    );

    return users.map((user) => this.mapUserResponse(user));
  }

  async findOne(id: number, currentUser: User) {
    const userId = this.normalizeRequiredPositiveInteger(id, 'id');
    const authorization = currentUser.authorization;

    if (authorization?.isSuperadmin) {
      return this.mapNullableUserResponse(
        await this.usersRepository.findById(userId),
      );
    }

    const access = this.resolveUserAccess(currentUser, USER_READ_PERMISSIONS);

    return this.mapNullableUserResponse(
      await this.usersRepository.findByIdForBusiness(
        userId,
        access.businessId,
        this.getAllowedBranchIdsForUserManageAccess(access),
      ),
    );
  }

  findByClerkId(clerkId: string) {
    return this.usersRepository.findByClerkId(clerkId);
  }

  findAuthenticatedByClerkId(clerkId: string): Promise<User | null> {
    return this.usersRepository.findByClerkId(clerkId);
  }

  async update(id: number, updateUserDto: UpdateUserDto, currentUser: User) {
    const userId = this.normalizeRequiredPositiveInteger(id, 'id');
    const dto = this.normalizeUpdateDto(updateUserDto);
    const authorization = currentUser.authorization;

    if (authorization?.isSuperadmin) {
      return this.mapNullableUserResponse(
        await this.usersRepository.update(userId, dto),
      );
    }

    const access = this.resolveUserAccess(currentUser, USER_MANAGE_PERMISSIONS);

    if (dto.branch_id !== undefined && dto.branch_id !== null) {
      this.assertBranchAllowedForUserManageAccess(access, dto.branch_id);
      await this.assertBranchBelongsToBusiness(
        dto.branch_id,
        access.businessId,
      );
    }

    dto.business_id = access.businessId;

    return this.mapNullableUserResponse(
      await this.usersRepository.updateForBusiness(
        userId,
        access.businessId,
        dto,
        this.getAllowedBranchIdsForUserManageAccess(access),
      ),
    );
  }

  remove(id: number, currentUser: User) {
    const userId = this.normalizeRequiredPositiveInteger(id, 'id');
    const authorization = currentUser.authorization;

    if (authorization?.isSuperadmin) {
      return this.usersRepository.remove(userId);
    }

    const access = this.resolveUserAccess(currentUser, USER_MANAGE_PERMISSIONS);

    return this.usersRepository.removeForBusiness(
      userId,
      access.businessId,
      this.getAllowedBranchIdsForUserManageAccess(access),
    );
  }

  private async normalizeCreateDto(
    createUserDto: CreateUserDto,
  ): Promise<NormalizedCreateUserDto> {
    const clerkId = this.normalizeRequiredString(
      createUserDto.clerk_id,
      'clerk_id',
    );
    const clerkProfile = await this.getClerkUserProfile(clerkId);

    return {
      clerk_id: clerkId,
      business_id: this.normalizeNullablePositiveInteger(
        createUserDto.business_id,
        'business_id',
      ),
      branch_id: this.normalizeNullablePositiveInteger(
        createUserDto.branch_id,
        'branch_id',
      ),
      name: this.normalizeRequiredString(
        createUserDto.name ?? clerkProfile.name,
        'name',
      ),
      email: this.normalizeRequiredString(
        createUserDto.email ?? clerkProfile.email,
        'email',
      ),
      photo_url:
        createUserDto.photo_url !== undefined
          ? this.normalizeOptionalString(createUserDto.photo_url)
          : clerkProfile.photo_url,
      role: 'EMPLOYEE',
      status: this.normalizeStatus(createUserDto.status ?? 'active'),
    };
  }

  private normalizeUpdateDto(updateUserDto: UpdateUserDto): UpdateUserDto {
    const dto: UpdateUserDto = {};

    if (updateUserDto.clerk_id !== undefined) {
      dto.clerk_id = this.normalizeRequiredString(
        updateUserDto.clerk_id,
        'clerk_id',
      );
    }

    if (Object.prototype.hasOwnProperty.call(updateUserDto, 'business_id')) {
      dto.business_id = this.normalizeNullablePositiveInteger(
        updateUserDto.business_id,
        'business_id',
      );
    }

    if (Object.prototype.hasOwnProperty.call(updateUserDto, 'branch_id')) {
      dto.branch_id = this.normalizeNullablePositiveInteger(
        updateUserDto.branch_id,
        'branch_id',
      );
    }

    if (updateUserDto.name !== undefined) {
      dto.name = this.normalizeRequiredString(updateUserDto.name, 'name');
    }

    if (updateUserDto.email !== undefined) {
      dto.email = this.normalizeRequiredString(updateUserDto.email, 'email');
    }

    if (Object.prototype.hasOwnProperty.call(updateUserDto, 'photo_url')) {
      dto.photo_url = this.normalizeOptionalString(updateUserDto.photo_url);
    }

    if (
      Object.prototype.hasOwnProperty.call(
        updateUserDto as Record<string, unknown>,
        'role',
      )
    ) {
      throw new BadRequestException('Role changes require an access policy');
    }

    if (updateUserDto.status !== undefined) {
      dto.status = this.normalizeStatus(updateUserDto.status);
    }

    return dto;
  }

  private normalizeRequiredString(value: string, field: string): string {
    const normalizedValue = value?.trim();

    if (!normalizedValue) {
      throw new BadRequestException(`${field} is required`);
    }

    return normalizedValue;
  }

  private normalizeRequiredPositiveInteger(
    value: unknown,
    field: string,
  ): number {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }

    return parsed;
  }

  private async getClerkUserProfile(
    clerkId: string,
  ): Promise<ClerkUserProfile> {
    try {
      const clerkUser = await clerkClient.users.getUser(clerkId);
      const primaryEmail =
        clerkUser.primaryEmailAddress?.emailAddress ??
        clerkUser.emailAddresses[0]?.emailAddress;
      const name =
        clerkUser.fullName ??
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ??
        clerkUser.username ??
        primaryEmail;

      if (!primaryEmail) {
        throw new BadRequestException('Clerk user has no email');
      }

      return {
        name: name || primaryEmail,
        email: primaryEmail,
        photo_url: clerkUser.imageUrl || null,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        `Unable to load Clerk user ${clerkId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private normalizeOptionalString(value: string | null | undefined) {
    if (value === undefined || value === null) {
      return null;
    }

    const normalizedValue = value.trim();

    return normalizedValue.length === 0 ? null : normalizedValue;
  }

  private normalizeNullablePositiveInteger(
    value: number | null | undefined,
    field: string,
  ): number | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }

    return value;
  }

  private normalizeOptionalPositiveInteger(
    value: unknown,
    field: string,
  ): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }

    return parsed;
  }

  private requireBusinessUserBusinessId(businessId: unknown): number {
    if (businessId === undefined || businessId === null || businessId === '') {
      throw new ForbiddenException('User must belong to a business');
    }

    return this.normalizeOptionalPositiveInteger(
      businessId,
      'businessId',
    ) as number;
  }

  private async assertBranchBelongsToBusiness(
    branchId: number,
    businessId: number,
  ): Promise<void> {
    const belongs = await this.usersRepository.branchBelongsToBusiness(
      branchId,
      businessId,
    );

    if (!belongs) {
      throw new ForbiddenException('Branch does not belong to business');
    }
  }

  private resolveUserAccess(
    currentUser: User,
    permissionKeys: readonly string[],
    requestedBusinessId?: unknown,
  ): UserManageAccess {
    const authorization = currentUser.authorization;

    if (!authorization) {
      throw new ForbiddenException('Authorization context is required');
    }

    if (authorization.isSuperadmin) {
      const businessId = this.normalizeOptionalPositiveInteger(
        requestedBusinessId,
        'businessId',
      );

      if (businessId === undefined) {
        throw new BadRequestException('businessId is required for superadmin');
      }

      return {
        businessId,
        accessScope: 'business',
        branchIds: [],
      };
    }

    const accessScope = this.resolveAccessScope(
      authorization.permissions,
      permissionKeys,
    );

    if (!accessScope) {
      throw new ForbiddenException(
        `Missing permission ${permissionKeys.join(' or ')}`,
      );
    }

    const businessId = this.requireBusinessUserBusinessId(
      authorization.businessId,
    );
    const parsedRequestedBusinessId = this.normalizeOptionalPositiveInteger(
      requestedBusinessId,
      'businessId',
    );

    if (
      parsedRequestedBusinessId !== undefined &&
      parsedRequestedBusinessId !== businessId
    ) {
      throw new ForbiddenException('Cannot access another business');
    }

    return {
      businessId,
      accessScope,
      branchIds: authorization.branchIds,
    };
  }

  private resolveAccessScope(
    permissions: Record<string, RolePermissionAccessScope>,
    permissionKeys: readonly string[],
  ): RolePermissionAccessScope | null {
    for (const permissionKey of permissionKeys) {
      const accessScope = permissions[permissionKey];

      if (accessScope) {
        return accessScope;
      }
    }

    return null;
  }

  private getAllowedBranchIdsForUserManageAccess(
    access: UserManageAccess,
  ): number[] | undefined {
    return access.accessScope === 'business' ? undefined : access.branchIds;
  }

  private assertBranchAllowedForUserManageAccess(
    access: UserManageAccess,
    branchId: number,
  ): void {
    if (access.accessScope === 'business') {
      return;
    }

    if (!access.branchIds.includes(branchId)) {
      throw new ForbiddenException('Branch is not assigned to user');
    }
  }

  private mapNullableUserResponse(user: User | null): UserResponse | null {
    return user ? this.mapUserResponse(user) : null;
  }

  private mapUserResponse(user: User): UserResponse {
    const {
      role: _legacyRole,
      authorization: _authorization,
      ...response
    } = user;

    return {
      ...response,
      roles: user.roles ?? [],
    };
  }

  private normalizeStatus(status: string): string {
    const normalizedStatus = status?.trim().toUpperCase();

    if (normalizedStatus !== 'ACTIVE' && normalizedStatus !== 'INACTIVE') {
      throw new BadRequestException('status must be one of: active, inactive');
    }

    return normalizedStatus;
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }
}
