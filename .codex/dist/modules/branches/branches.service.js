"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchesService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const branches_repository_1 = require("./branches.repository");
const DEFAULT_BRANCH_IMAGES_FOLDER = 'turnero/branches';
const OPENING_HOURS_DAYS = [
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
};
let BranchesService = class BranchesService {
    branchesRepository;
    configService;
    constructor(branchesRepository, configService) {
        this.branchesRepository = branchesRepository;
        this.configService = configService;
    }
    create(createBranchDto) {
        return this.branchesRepository.create(createBranchDto);
    }
    createForBusiness(createBranchDto, currentUser) {
        const authorization = this.requireAuthorization(currentUser);
        if (authorization.isSuperadmin) {
            return this.create(createBranchDto);
        }
        const accessScope = authorization.permissions['branch.manage'];
        if (!accessScope) {
            throw new common_1.ForbiddenException('Missing permission branch.manage');
        }
        if (ACCESS_SCOPE_WEIGHT[accessScope] < ACCESS_SCOPE_WEIGHT.business) {
            throw new common_1.ForbiddenException('Business scope is required');
        }
        const businessId = this.requireBusinessUserBusinessId(authorization.businessId);
        return this.create({
            ...createBranchDto,
            business_id: businessId,
        });
    }
    findAll() {
        return this.branchesRepository.findAll();
    }
    findAllForBusiness(currentUser) {
        const authorization = this.requireAuthorization(currentUser);
        if (authorization.isSuperadmin) {
            return this.findAll();
        }
        const accessScope = authorization.permissions['branch.manage'] ??
            authorization.permissions['user.manage'];
        if (!accessScope) {
            throw new common_1.ForbiddenException('Missing permission branch.manage or user.manage');
        }
        const businessId = this.requireBusinessUserBusinessId(authorization.businessId);
        const allowedBranchIds = ACCESS_SCOPE_WEIGHT[accessScope] >= ACCESS_SCOPE_WEIGHT.business
            ? undefined
            : authorization.branchIds;
        return this.branchesRepository.findAllForBusiness(businessId, allowedBranchIds);
    }
    async findOne(id, currentUser) {
        this.validatePositiveInteger(id, 'id');
        const accessScope = this.resolveBranchReadAccessScope(id, currentUser);
        return accessScope.businessId === undefined
            ? this.branchesRepository.findById(id)
            : this.branchesRepository.findByIdForBusiness(id, accessScope.businessId, accessScope.allowedBranchIds);
    }
    async update(id, updateBranchDto, currentUser) {
        this.validatePositiveInteger(id, 'id');
        const dto = this.normalizeUpdateDto(updateBranchDto);
        const updateScope = this.resolveBranchAccessScope(id, currentUser, [
            'branch.manage',
            'business.settings',
        ]);
        return this.updateBranch(id, dto, updateScope.businessId);
    }
    async createImageUploadSignature(id, dto, currentUser) {
        this.validatePositiveInteger(id, 'id');
        const branch = await this.resolveBranchForMediaUpload(id, currentUser);
        const imageType = this.normalizeImageType(dto.image_type);
        const cloudName = this.getRequiredConfig('CLOUDINARY_CLOUD_NAME');
        const apiKey = this.getRequiredConfig('CLOUDINARY_API_KEY');
        const apiSecret = this.getRequiredConfig('CLOUDINARY_API_SECRET');
        const timestamp = Math.floor(Date.now() / 1000);
        const publicId = this.buildBranchImagePublicId(branch, imageType, timestamp);
        const signature = this.signCloudinaryUploadParams({
            public_id: publicId,
            timestamp: String(timestamp),
        }, apiSecret);
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
    resolveBranchAccessScope(id, currentUser, permissionKeys = ['branch.manage']) {
        const authorization = this.requireAuthorization(currentUser);
        if (authorization.isSuperadmin) {
            return {};
        }
        const permissionGrant = this.resolveBranchPermissionGrant(authorization.permissions, permissionKeys);
        if (!permissionGrant) {
            throw new common_1.ForbiddenException(`Missing permission ${permissionKeys.join(' or ')}`);
        }
        const businessId = this.requireBusinessUserBusinessId(authorization.businessId);
        const { permission, accessScope } = permissionGrant;
        if (permission === 'business.settings' &&
            ACCESS_SCOPE_WEIGHT[accessScope] < ACCESS_SCOPE_WEIGHT.business) {
            throw new common_1.ForbiddenException('Business scope is required');
        }
        if (ACCESS_SCOPE_WEIGHT[accessScope] >= ACCESS_SCOPE_WEIGHT.business) {
            return { businessId };
        }
        if (!authorization.branchIds.includes(id)) {
            throw new common_1.ForbiddenException('Branch is not assigned to user');
        }
        return { businessId };
    }
    resolveBranchPermissionGrant(permissions, permissionKeys) {
        let selectedGrant = null;
        for (const permission of permissionKeys) {
            const accessScope = permissions[permission];
            if (accessScope &&
                (!selectedGrant ||
                    ACCESS_SCOPE_WEIGHT[accessScope] >
                        ACCESS_SCOPE_WEIGHT[selectedGrant.accessScope])) {
                selectedGrant = { permission, accessScope };
            }
        }
        return selectedGrant;
    }
    resolveBranchReadAccessScope(id, currentUser) {
        const authorization = this.requireAuthorization(currentUser);
        if (authorization.isSuperadmin) {
            return {};
        }
        const businessId = this.requireBusinessUserBusinessId(authorization.businessId);
        const accessScope = authorization.permissions['branch.manage'];
        if (accessScope &&
            ACCESS_SCOPE_WEIGHT[accessScope] >= ACCESS_SCOPE_WEIGHT.business) {
            return { businessId };
        }
        if (!authorization.branchIds.includes(id)) {
            throw new common_1.ForbiddenException('Branch is not assigned to user');
        }
        return {
            businessId,
            allowedBranchIds: authorization.branchIds,
        };
    }
    async resolveBranchForMediaUpload(id, currentUser) {
        const updateScope = this.resolveBranchAccessScope(id, currentUser, [
            'branch.manage',
            'business.settings',
        ]);
        const branch = updateScope.businessId === undefined
            ? await this.branchesRepository.findById(id)
            : await this.branchesRepository.findByIdForBusiness(id, updateScope.businessId);
        if (!branch) {
            throw new common_1.NotFoundException('Branch not found');
        }
        return branch;
    }
    async updateBranch(id, dto, businessId) {
        try {
            return await this.branchesRepository.update(id, dto, businessId);
        }
        catch (error) {
            if (this.isUniqueViolation(error)) {
                throw new common_1.ConflictException('Branch slug already exists for business');
            }
            throw error;
        }
    }
    remove(id) {
        return this.branchesRepository.remove(id);
    }
    async removeForBusiness(id, currentUser) {
        this.validatePositiveInteger(id, 'id');
        const accessScope = this.resolveBranchAccessScope(id, currentUser);
        if (accessScope.businessId === undefined) {
            return this.remove(id);
        }
        return this.branchesRepository.removeForBusiness(id, accessScope.businessId);
    }
    normalizeUpdateDto(updateBranchDto) {
        this.assertNoProtectedFields(updateBranchDto);
        const dto = {};
        if (updateBranchDto.name !== undefined) {
            dto.name = this.normalizeRequiredString(updateBranchDto.name, 'name', 150);
        }
        if (updateBranchDto.slug !== undefined) {
            dto.slug = this.normalizeRequiredString(updateBranchDto.slug, 'slug', 150);
        }
        if (Object.prototype.hasOwnProperty.call(updateBranchDto, 'description')) {
            dto.description = this.normalizeOptionalString(updateBranchDto.description, 'description');
        }
        if (Object.prototype.hasOwnProperty.call(updateBranchDto, 'logo_url')) {
            dto.logo_url = this.normalizeOptionalString(updateBranchDto.logo_url, 'logo_url');
        }
        if (Object.prototype.hasOwnProperty.call(updateBranchDto, 'cover_image_url')) {
            dto.cover_image_url = this.normalizeOptionalString(updateBranchDto.cover_image_url, 'cover_image_url');
        }
        if (Object.prototype.hasOwnProperty.call(updateBranchDto, 'primary_color')) {
            dto.primary_color = this.normalizeOptionalString(updateBranchDto.primary_color, 'primary_color', 30);
        }
        if (Object.prototype.hasOwnProperty.call(updateBranchDto, 'instagram_url')) {
            dto.instagram_url = this.normalizeOptionalString(updateBranchDto.instagram_url, 'instagram_url');
        }
        if (Object.prototype.hasOwnProperty.call(updateBranchDto, 'facebook_url')) {
            dto.facebook_url = this.normalizeOptionalString(updateBranchDto.facebook_url, 'facebook_url');
        }
        if (updateBranchDto.address !== undefined) {
            dto.address = this.normalizeRequiredString(updateBranchDto.address, 'address');
        }
        if (updateBranchDto.phone !== undefined) {
            dto.phone = this.normalizeRequiredString(updateBranchDto.phone, 'phone', 30);
        }
        if (Object.prototype.hasOwnProperty.call(updateBranchDto, 'lat')) {
            dto.lat = this.normalizeOptionalCoordinate(updateBranchDto.lat, 'lat', -90, 90);
        }
        if (Object.prototype.hasOwnProperty.call(updateBranchDto, 'lng')) {
            dto.lng = this.normalizeOptionalCoordinate(updateBranchDto.lng, 'lng', -180, 180);
        }
        if (Object.prototype.hasOwnProperty.call(updateBranchDto, 'opening_hours')) {
            dto.opening_hours = this.normalizeOpeningHours(updateBranchDto.opening_hours);
        }
        return dto;
    }
    assertNoProtectedFields(updateBranchDto) {
        const payload = updateBranchDto;
        const protectedFields = [
            'id',
            'business_id',
            'status',
            'created_at',
            'updated_at',
        ];
        const providedProtectedFields = protectedFields.filter((field) => Object.prototype.hasOwnProperty.call(payload, field));
        if (providedProtectedFields.length > 0) {
            throw new common_1.BadRequestException(`${providedProtectedFields.join(', ')} cannot be updated`);
        }
    }
    normalizeRequiredString(value, field, maxLength) {
        if (typeof value !== 'string' || value.trim().length === 0) {
            throw new common_1.BadRequestException(`${field} must be a non-empty string`);
        }
        const normalizedValue = value.trim();
        if (maxLength !== undefined && normalizedValue.length > maxLength) {
            throw new common_1.BadRequestException(`${field} must be ${maxLength} characters or less`);
        }
        return normalizedValue;
    }
    normalizeOptionalString(value, field, maxLength) {
        if (value === undefined || value === null) {
            return null;
        }
        if (typeof value !== 'string') {
            throw new common_1.BadRequestException(`${field} must be a string or null`);
        }
        const normalizedValue = value.trim();
        if (maxLength !== undefined && normalizedValue.length > maxLength) {
            throw new common_1.BadRequestException(`${field} must be ${maxLength} characters or less`);
        }
        return normalizedValue || null;
    }
    normalizeOptionalCoordinate(value, field, min, max) {
        if (value === undefined || value === null) {
            return null;
        }
        if (typeof value === 'string' && value.trim().length === 0) {
            return null;
        }
        const normalizedValue = typeof value === 'number'
            ? value
            : typeof value === 'string'
                ? Number(value.trim())
                : Number.NaN;
        if (!Number.isFinite(normalizedValue)) {
            throw new common_1.BadRequestException(`${field} must be a number or null`);
        }
        if (normalizedValue < min || normalizedValue > max) {
            throw new common_1.BadRequestException(`${field} must be between ${min} and ${max}`);
        }
        return normalizedValue;
    }
    normalizeOpeningHours(value) {
        if (value === undefined || value === null) {
            return null;
        }
        if (!this.isPlainObject(value)) {
            throw new common_1.BadRequestException('opening_hours must be an object or null');
        }
        const unknownDays = Object.keys(value).filter((day) => !OPENING_HOURS_DAYS.includes(day));
        if (unknownDays.length > 0) {
            throw new common_1.BadRequestException(`opening_hours has invalid days: ${unknownDays.join(', ')}`);
        }
        return OPENING_HOURS_DAYS.reduce((openingHours, day) => {
            const ranges = value[day];
            if (!Array.isArray(ranges)) {
                throw new common_1.BadRequestException(`opening_hours.${day} must be an array`);
            }
            openingHours[day] = ranges.map((range, index) => this.normalizeOpeningHoursRange(range, `opening_hours.${day}.${index}`));
            return openingHours;
        }, {});
    }
    normalizeOpeningHoursRange(value, field) {
        if (!this.isPlainObject(value)) {
            throw new common_1.BadRequestException(`${field} must be an object`);
        }
        const open = this.normalizeTimeValue(value.open, `${field}.open`);
        const close = this.normalizeTimeValue(value.close, `${field}.close`);
        return { open, close };
    }
    normalizeTimeValue(value, field) {
        if (typeof value !== 'string' || !TIME_VALUE_PATTERN.test(value.trim())) {
            throw new common_1.BadRequestException(`${field} must use HH:mm format`);
        }
        return value.trim();
    }
    isPlainObject(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
    requireAuthorization(currentUser) {
        if (!currentUser.authorization) {
            throw new common_1.ForbiddenException('Authorization context is required');
        }
        return currentUser.authorization;
    }
    requireBusinessUserBusinessId(businessId) {
        if (businessId === undefined || businessId === null || businessId === '') {
            throw new common_1.ForbiddenException('User must belong to a business');
        }
        const parsed = Number(businessId);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new common_1.BadRequestException('businessId must be a positive integer');
        }
        return parsed;
    }
    validatePositiveInteger(value, field) {
        if (!Number.isInteger(value) || value <= 0) {
            throw new common_1.BadRequestException(`${field} must be a positive integer`);
        }
    }
    normalizeImageType(imageType) {
        if (imageType === 'logo' || imageType === 'cover') {
            return imageType;
        }
        throw new common_1.BadRequestException('image_type must be logo or cover');
    }
    buildBranchImagePublicId(branch, imageType, timestamp) {
        const folder = this.getOptionalConfig('CLOUDINARY_BRANCH_IMAGES_FOLDER');
        const baseFolder = this.sanitizePublicIdPath(folder ?? DEFAULT_BRANCH_IMAGES_FOLDER) ??
            DEFAULT_BRANCH_IMAGES_FOLDER;
        const slug = this.sanitizePublicIdPath(branch.slug) ?? String(branch.id);
        return [
            baseFolder,
            String(branch.business_id),
            String(branch.id),
            `${imageType}-${slug}-${timestamp}`,
        ].join('/');
    }
    signCloudinaryUploadParams(params, apiSecret) {
        const serializedParams = Object.keys(params)
            .sort()
            .map((key) => `${key}=${params[key]}`)
            .join('&');
        return (0, crypto_1.createHash)('sha1')
            .update(serializedParams + apiSecret)
            .digest('hex');
    }
    getRequiredConfig(key) {
        const value = this.getOptionalConfig(key);
        if (!value) {
            throw new common_1.ServiceUnavailableException(`${key} is required`);
        }
        return value;
    }
    getOptionalConfig(key) {
        const value = this.configService.get(key)?.trim();
        return value || null;
    }
    sanitizePublicIdPath(value) {
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
    isUniqueViolation(error) {
        return (typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === '23505');
    }
};
exports.BranchesService = BranchesService;
exports.BranchesService = BranchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [branches_repository_1.BranchesRepository,
        config_1.ConfigService])
], BranchesService);
//# sourceMappingURL=branches.service.js.map