import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { clerkClient } from '@clerk/express';
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

type UserResponse = Omit<User, 'role' | 'authorization'>;

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto, currentUser: User) {
    const businessId = this.resolveUserBusinessId(currentUser);
    if (
      createUserDto.business_id !== undefined &&
      createUserDto.business_id !== businessId
    ) {
      throw new ForbiddenException('Cannot access another business');
    }
    if (
      createUserDto.branch_id !== undefined &&
      createUserDto.branch_id !== null
    ) {
      await this.assertBranchBelongsToBusiness(
        createUserDto.branch_id,
        businessId,
      );
    }
    const dto = await this.normalizeCreateDto({
      ...createUserDto,
      business_id: businessId,
    });

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
    const businessId = this.resolveUserBusinessId(currentUser);

    if (branchId !== undefined) {
      await this.assertBranchBelongsToBusiness(branchId, businessId);
    }

    const users = await this.usersRepository.findAllForBusiness(
      businessId,
      branchId,
    );

    return users.map((user) => this.mapUserResponse(user));
  }

  async findOne(id: number, currentUser: User) {
    const userId = this.normalizeRequiredPositiveInteger(id, 'id');
    const businessId = this.resolveUserBusinessId(currentUser);

    return this.mapNullableUserResponse(
      await this.usersRepository.findByIdForBusiness(userId, businessId),
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
    const businessId = this.resolveUserBusinessId(currentUser);
    if (
      updateUserDto.business_id !== undefined &&
      updateUserDto.business_id !== businessId
    ) {
      throw new ForbiddenException('Cannot access another business');
    }
    const dto = this.normalizeUpdateDto(updateUserDto);

    if (dto.branch_id !== undefined && dto.branch_id !== null) {
      await this.assertBranchBelongsToBusiness(dto.branch_id, businessId);
    }

    dto.business_id = businessId;

    return this.mapNullableUserResponse(
      await this.usersRepository.updateForBusiness(userId, businessId, dto),
    );
  }

  remove(id: number, currentUser: User) {
    const userId = this.normalizeRequiredPositiveInteger(id, 'id');
    const businessId = this.resolveUserBusinessId(currentUser);

    return this.usersRepository.removeForBusiness(userId, businessId);
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

  private resolveUserBusinessId(currentUser: User): number {
    if (!currentUser.authorization) {
      throw new ForbiddenException('Authorization context is required');
    }
    return this.requireBusinessUserBusinessId(
      currentUser.authorization.businessId,
    );
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
