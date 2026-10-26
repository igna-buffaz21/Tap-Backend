import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import type { RolePermissionAccessScope } from '../auth/interfaces/auth-user.interface';
import { User } from '../users/entities/user.entity';
import { BranchImageUploadSignatureDto } from './dto/branch-image-upload-signature.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import {
  BranchImageType,
  CreateBranchImageUploadSignatureDto,
} from './dto/create-branch-image-upload-signature.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchesRepository } from './branches.repository';
import {
  BRANCH_TYPES,
  Branch,
  BranchOpeningHours,
  BranchOpeningHoursDay,
  BranchType,
} from './entities/branch.entity';

const DEFAULT_BRANCH_IMAGES_FOLDER = 'turnero/branches';
const OPENING_HOURS_DAYS: BranchOpeningHoursDay[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];
const TIME_VALUE_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const ACCESS_SCOPE_WEIGHT = {
  own: 1,
  branch: 2,
  business: 3,
} as const;
type BranchAccessPermission = 'branch.manage' | 'business.settings';

@Injectable()
export class BranchesService {
  constructor(
    private readonly branchesRepository: BranchesRepository,
    private readonly configService: ConfigService,
  ) {}

  create(createBranchDto: CreateBranchDto) {
    return this.branchesRepository.create({
      ...createBranchDto,
      branch_type: this.validateBranchType(createBranchDto.branch_type),
    });
  }

  createForBusiness(createBranchDto: CreateBranchDto, currentUser: User) {
    const authorization = this.requireAuthorization(currentUser);

    if (authorization.isSuperadmin) {
      return this.create(createBranchDto);
    }

    const accessScope = authorization.permissions['branch.manage'];

    if (!accessScope) {
      throw new ForbiddenException('Missing permission branch.manage');
    }

    if (ACCESS_SCOPE_WEIGHT[accessScope] < ACCESS_SCOPE_WEIGHT.business) {
      throw new ForbiddenException('Business scope is required');
    }

    const businessId = this.requireBusinessUserBusinessId(
      authorization.businessId,
    );

    return this.create({
      ...createBranchDto,
      business_id: businessId,
    });
  }

  findAll() {
    return this.branchesRepository.findAll();
  }

  findAllForBusiness(currentUser: User) {
    const authorization = this.requireAuthorization(currentUser);

    if (authorization.isSuperadmin) {
      return this.findAll();
    }

    const accessScope =
      authorization.permissions['branch.manage'] ??
      authorization.permissions['user.manage'];

    if (!accessScope) {
      throw new ForbiddenException(
        'Missing permission branch.manage or user.manage',
      );
    }

    const businessId = this.requireBusinessUserBusinessId(
      authorization.businessId,
    );
    const allowedBranchIds =
      ACCESS_SCOPE_WEIGHT[accessScope] >= ACCESS_SCOPE_WEIGHT.business
        ? undefined
        : authorization.branchIds;

    return this.branchesRepository.findAllForBusiness(
      businessId,
      allowedBranchIds,
    );
  }

  async findOne(id: number, currentUser: User) {
    this.validatePositiveInteger(id, 'id');

    const accessScope = this.resolveBranchReadAccessScope(id, currentUser);

    return accessScope.businessId === undefined
      ? this.branchesRepository.findById(id)
      : this.branchesRepository.findByIdForBusiness(
          id,
          accessScope.businessId,
          accessScope.allowedBranchIds,
        );
  }

  async update(
    id: number,
    updateBranchDto: UpdateBranchDto,
    currentUser: User,
  ) {
    this.validatePositiveInteger(id, 'id');

    const dto = this.normalizeUpdateDto(updateBranchDto);
    const updateScope = this.resolveBranchAccessScope(id, currentUser, [
      'branch.manage',
      'business.settings',
    ]);

    return this.updateBranch(id, dto, updateScope.businessId);
  }

  async createImageUploadSignature(
    id: number,
    dto: CreateBranchImageUploadSignatureDto,
    currentUser: User,
  ): Promise<BranchImageUploadSignatureDto> {
    this.validatePositiveInteger(id, 'id');

    const branch = await this.resolveBranchForMediaUpload(id, currentUser);
    const imageType = this.normalizeImageType(dto.image_type);
    const cloudName = this.getRequiredConfig('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.getRequiredConfig('CLOUDINARY_API_KEY');
    const apiSecret = this.getRequiredConfig('CLOUDINARY_API_SECRET');
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = this.buildBranchImagePublicId(
      branch,
      imageType,
      timestamp,
    );
    const signature = this.signCloudinaryUploadParams(
      {
        public_id: publicId,
        timestamp: String(timestamp),
      },
      apiSecret,
    );

    return {
      cloud_name: cloudName,
      api_key: apiKey,
      upload_url: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      resource_type: 'image',
      timestamp,
      public_id: publicId,
      signature,
    };
  }

  private resolveBranchAccessScope(
    id: number,
    currentUser: User,
    permissionKeys: BranchAccessPermission[] = ['branch.manage'],
  ): { businessId?: number } {
    const authorization = this.requireAuthorization(currentUser);

    if (authorization.isSuperadmin) {
      return {};
    }

    const permissionGrant = this.resolveBranchPermissionGrant(
      authorization.permissions,
      permissionKeys,
    );

    if (!permissionGrant) {
      throw new ForbiddenException(
        `Missing permission ${permissionKeys.join(' or ')}`,
      );
    }

    const businessId = this.requireBusinessUserBusinessId(
      authorization.businessId,
    );

    const { permission, accessScope } = permissionGrant;

    if (
      permission === 'business.settings' &&
      ACCESS_SCOPE_WEIGHT[accessScope] < ACCESS_SCOPE_WEIGHT.branch
    ) {
      throw new ForbiddenException('Branch scope is required');
    }

    if (ACCESS_SCOPE_WEIGHT[accessScope] >= ACCESS_SCOPE_WEIGHT.business) {
      return { businessId };
    }

    if (!authorization.branchIds.includes(id)) {
      throw new ForbiddenException('Branch is not assigned to user');
    }

    return { businessId };
  }

  private resolveBranchPermissionGrant(
    permissions: Record<string, RolePermissionAccessScope>,
    permissionKeys: BranchAccessPermission[],
  ): {
    permission: BranchAccessPermission;
    accessScope: RolePermissionAccessScope;
  } | null {
    let selectedGrant: {
      permission: BranchAccessPermission;
      accessScope: RolePermissionAccessScope;
    } | null = null;

    for (const permission of permissionKeys) {
      const accessScope = permissions[permission];

      if (
        accessScope &&
        (!selectedGrant ||
          ACCESS_SCOPE_WEIGHT[accessScope] >
            ACCESS_SCOPE_WEIGHT[selectedGrant.accessScope])
      ) {
        selectedGrant = { permission, accessScope };
      }
    }

    return selectedGrant;
  }

  private resolveBranchReadAccessScope(
    id: number,
    currentUser: User,
  ): { businessId?: number; allowedBranchIds?: number[] } {
    const authorization = this.requireAuthorization(currentUser);

    if (authorization.isSuperadmin) {
      return {};
    }

    const businessId = this.requireBusinessUserBusinessId(
      authorization.businessId,
    );
    const accessScope = authorization.permissions['branch.manage'];

    if (
      accessScope &&
      ACCESS_SCOPE_WEIGHT[accessScope] >= ACCESS_SCOPE_WEIGHT.business
    ) {
      return { businessId };
    }

    if (!authorization.branchIds.includes(id)) {
      throw new ForbiddenException('Branch is not assigned to user');
    }

    return {
      businessId,
      allowedBranchIds: authorization.branchIds,
    };
  }

  private async resolveBranchForMediaUpload(
    id: number,
    currentUser: User,
  ): Promise<Branch> {
    const updateScope = this.resolveBranchAccessScope(id, currentUser, [
      'branch.manage',
      'business.settings',
    ]);
    const branch =
      updateScope.businessId === undefined
        ? await this.branchesRepository.findById(id)
        : await this.branchesRepository.findByIdForBusiness(
            id,
            updateScope.businessId,
          );

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  private async updateBranch(
    id: number,
    dto: UpdateBranchDto,
    businessId?: number,
  ) {
    try {
      return await this.branchesRepository.update(id, dto, businessId);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Branch slug already exists for business');
      }

      throw error;
    }
  }

  remove(id: number) {
    return this.branchesRepository.remove(id);
  }

  async removeForBusiness(id: number, currentUser: User) {
    this.validatePositiveInteger(id, 'id');

    const accessScope = this.resolveBranchAccessScope(id, currentUser);

    if (accessScope.businessId === undefined) {
      return this.remove(id);
    }

    return this.branchesRepository.removeForBusiness(
      id,
      accessScope.businessId,
    );
  }

  private normalizeUpdateDto(
    updateBranchDto: UpdateBranchDto,
  ): UpdateBranchDto {
    this.assertNoProtectedFields(updateBranchDto);

    const dto: UpdateBranchDto = {};

    if (updateBranchDto.branch_type !== undefined) {
      dto.branch_type = this.validateBranchType(updateBranchDto.branch_type);
    }

    if (updateBranchDto.name !== undefined) {
      dto.name = this.normalizeRequiredString(
        updateBranchDto.name,
        'name',
        150,
      );
    }

    if (updateBranchDto.slug !== undefined) {
      dto.slug = this.normalizeRequiredString(
        updateBranchDto.slug,
        'slug',
        150,
      );
    }

    if (Object.prototype.hasOwnProperty.call(updateBranchDto, 'description')) {
      dto.description = this.normalizeOptionalString(
        updateBranchDto.description,
        'description',
      );
    }

    if (Object.prototype.hasOwnProperty.call(updateBranchDto, 'logo_url')) {
      dto.logo_url = this.normalizeOptionalString(
        updateBranchDto.logo_url,
        'logo_url',
      );
    }

    if (
      Object.prototype.hasOwnProperty.call(updateBranchDto, 'cover_image_url')
    ) {
      dto.cover_image_url = this.normalizeOptionalString(
        updateBranchDto.cover_image_url,
        'cover_image_url',
      );
    }

    if (
      Object.prototype.hasOwnProperty.call(updateBranchDto, 'primary_color')
    ) {
      dto.primary_color = this.normalizeOptionalString(
        updateBranchDto.primary_color,
        'primary_color',
        30,
      );
    }

    if (
      Object.prototype.hasOwnProperty.call(updateBranchDto, 'instagram_url')
    ) {
      dto.instagram_url = this.normalizeOptionalString(
        updateBranchDto.instagram_url,
        'instagram_url',
      );
    }

    if (Object.prototype.hasOwnProperty.call(updateBranchDto, 'facebook_url')) {
      dto.facebook_url = this.normalizeOptionalString(
        updateBranchDto.facebook_url,
        'facebook_url',
      );
    }

    if (updateBranchDto.address !== undefined) {
      dto.address = this.normalizeRequiredString(
        updateBranchDto.address,
        'address',
      );
    }

    if (updateBranchDto.phone !== undefined) {
      dto.phone = this.normalizeRequiredString(
        updateBranchDto.phone,
        'phone',
        30,
      );
    }

    if (Object.prototype.hasOwnProperty.call(updateBranchDto, 'lat')) {
      dto.lat = this.normalizeOptionalCoordinate(
        updateBranchDto.lat,
        'lat',
        -90,
        90,
      );
    }

    if (Object.prototype.hasOwnProperty.call(updateBranchDto, 'lng')) {
      dto.lng = this.normalizeOptionalCoordinate(
        updateBranchDto.lng,
        'lng',
        -180,
        180,
      );
    }

    if (
      Object.prototype.hasOwnProperty.call(updateBranchDto, 'opening_hours')
    ) {
      dto.opening_hours = this.normalizeOpeningHours(
        updateBranchDto.opening_hours,
      );
    }

    return dto;
  }

  private validateBranchType(value: unknown): BranchType | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (
      typeof value !== 'string' ||
      !BRANCH_TYPES.includes(value as BranchType)
    ) {
      throw new BadRequestException(
        `branch_type must be one of: ${BRANCH_TYPES.join(', ')}`,
      );
    }

    return value as BranchType;
  }

  private assertNoProtectedFields(updateBranchDto: UpdateBranchDto): void {
    const payload = updateBranchDto as Record<string, unknown>;
    const protectedFields = [
      'id',
      'business_id',
      'status',
      'created_at',
      'updated_at',
    ];
    const providedProtectedFields = protectedFields.filter((field) =>
      Object.prototype.hasOwnProperty.call(payload, field),
    );

    if (providedProtectedFields.length > 0) {
      throw new BadRequestException(
        `${providedProtectedFields.join(', ')} cannot be updated`,
      );
    }
  }

  private normalizeRequiredString(
    value: unknown,
    field: string,
    maxLength?: number,
  ): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(`${field} must be a non-empty string`);
    }

    const normalizedValue = value.trim();

    if (maxLength !== undefined && normalizedValue.length > maxLength) {
      throw new BadRequestException(
        `${field} must be ${maxLength} characters or less`,
      );
    }

    return normalizedValue;
  }

  private normalizeOptionalString(
    value: unknown,
    field: string,
    maxLength?: number,
  ): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${field} must be a string or null`);
    }

    const normalizedValue = value.trim();

    if (maxLength !== undefined && normalizedValue.length > maxLength) {
      throw new BadRequestException(
        `${field} must be ${maxLength} characters or less`,
      );
    }

    return normalizedValue || null;
  }

  private normalizeOptionalCoordinate(
    value: unknown,
    field: string,
    min: number,
    max: number,
  ): number | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value === 'string' && value.trim().length === 0) {
      return null;
    }

    const normalizedValue =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value.trim())
          : Number.NaN;

    if (!Number.isFinite(normalizedValue)) {
      throw new BadRequestException(`${field} must be a number or null`);
    }

    if (normalizedValue < min || normalizedValue > max) {
      throw new BadRequestException(
        `${field} must be between ${min} and ${max}`,
      );
    }

    return normalizedValue;
  }

  private normalizeOpeningHours(value: unknown): BranchOpeningHours | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (!this.isPlainObject(value)) {
      throw new BadRequestException('opening_hours must be an object or null');
    }

    const unknownDays = Object.keys(value).filter(
      (day) => !OPENING_HOURS_DAYS.includes(day as BranchOpeningHoursDay),
    );

    if (unknownDays.length > 0) {
      throw new BadRequestException(
        `opening_hours has invalid days: ${unknownDays.join(', ')}`,
      );
    }

    return OPENING_HOURS_DAYS.reduce((openingHours, day) => {
      const ranges = value[day];

      if (!Array.isArray(ranges)) {
        throw new BadRequestException(`opening_hours.${day} must be an array`);
      }

      openingHours[day] = ranges.map((range, index) =>
        this.normalizeOpeningHoursRange(range, `opening_hours.${day}.${index}`),
      );

      return openingHours;
    }, {} as BranchOpeningHours);
  }

  private normalizeOpeningHoursRange(
    value: unknown,
    field: string,
  ): { open: string; close: string } {
    if (!this.isPlainObject(value)) {
      throw new BadRequestException(`${field} must be an object`);
    }

    const open = this.normalizeTimeValue(value.open, `${field}.open`);
    const close = this.normalizeTimeValue(value.close, `${field}.close`);

    return { open, close };
  }

  private normalizeTimeValue(value: unknown, field: string): string {
    if (typeof value !== 'string' || !TIME_VALUE_PATTERN.test(value.trim())) {
      throw new BadRequestException(`${field} must use HH:mm format`);
    }

    return value.trim();
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private requireAuthorization(currentUser: User) {
    if (!currentUser.authorization) {
      throw new ForbiddenException('Authorization context is required');
    }

    return currentUser.authorization;
  }

  private requireBusinessUserBusinessId(businessId: unknown): number {
    if (businessId === undefined || businessId === null || businessId === '') {
      throw new ForbiddenException('User must belong to a business');
    }

    const parsed = Number(businessId);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException('businessId must be a positive integer');
    }

    return parsed;
  }

  private validatePositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }
  }

  private normalizeImageType(imageType: unknown): BranchImageType {
    if (imageType === 'logo' || imageType === 'cover') {
      return imageType;
    }

    throw new BadRequestException('image_type must be logo or cover');
  }

  private buildBranchImagePublicId(
    branch: Branch,
    imageType: BranchImageType,
    timestamp: number,
  ): string {
    const folder = this.getOptionalConfig('CLOUDINARY_BRANCH_IMAGES_FOLDER');
    const baseFolder =
      this.sanitizePublicIdPath(folder ?? DEFAULT_BRANCH_IMAGES_FOLDER) ??
      DEFAULT_BRANCH_IMAGES_FOLDER;
    const slug = this.sanitizePublicIdPath(branch.slug) ?? String(branch.id);

    return [
      baseFolder,
      String(branch.business_id),
      String(branch.id),
      `${imageType}-${slug}-${timestamp}`,
    ].join('/');
  }

  private signCloudinaryUploadParams(
    params: Record<string, string>,
    apiSecret: string,
  ): string {
    const serializedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    return createHash('sha1')
      .update(serializedParams + apiSecret)
      .digest('hex');
  }

  private getRequiredConfig(key: string): string {
    const value = this.getOptionalConfig(key);

    if (!value) {
      throw new ServiceUnavailableException(`${key} is required`);
    }

    return value;
  }

  private getOptionalConfig(key: string): string | null {
    const value = this.configService.get<string>(key)?.trim();

    return value || null;
  }

  private sanitizePublicIdPath(value: string): string | null {
    const sanitizedValue = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9/_-]+/g, '-')
      .replace(/\/+/g, '/')
      .replace(/-+/g, '-')
      .replace(/^\/|\/$/g, '')
      .replace(/^-|-$/g, '');

    return sanitizedValue || null;
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
