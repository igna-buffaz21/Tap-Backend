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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const express_1 = require("@clerk/express");
const users_repository_1 = require("./users.repository");
const USER_READ_PERMISSIONS = ['user.read', 'user.manage'];
const USER_MANAGE_PERMISSIONS = ['user.manage'];
let UsersService = class UsersService {
    usersRepository;
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async create(createUserDto) {
        const dto = await this.normalizeCreateDto(createUserDto);
        try {
            return this.mapUserResponse(await this.usersRepository.create(dto));
        }
        catch (error) {
            if (this.isUniqueViolation(error)) {
                throw new common_1.ConflictException('User already exists');
            }
            throw error;
        }
    }
    async invite(inviteUserDto, currentUser) {
        const access = this.resolveUserAccess(currentUser, USER_MANAGE_PERMISSIONS);
        const email = this.normalizeEmail(inviteUserDto.email);
        const name = inviteUserDto.name !== undefined
            ? this.normalizeRequiredString(inviteUserDto.name, 'name')
            : email;
        const roleIds = this.normalizePositiveIntegerList([inviteUserDto.role_id, ...(inviteUserDto.role_ids ?? [])], 'role_ids');
        const branchIds = this.normalizePositiveIntegerList([inviteUserDto.branch_id, ...(inviteUserDto.branch_ids ?? [])], 'branch_ids', false);
        this.assertBranchScopeAllowsInvite(access, branchIds);
        await this.assertBranchesBelongToBusiness(branchIds, access.businessId);
        await this.assertRolesAvailableForBusiness(roleIds, access.businessId);
        const existingUser = await this.usersRepository.findByEmail(email);
        if (existingUser) {
            throw new common_1.ConflictException('User email already exists');
        }
        const user = await this.usersRepository.createPendingInvitation({
            businessId: access.businessId,
            email,
            name,
            roleIds,
            branchIds,
        });
        try {
            const invitation = await express_1.clerkClient.invitations.createInvitation({
                emailAddress: email,
                notify: true,
                publicMetadata: {
                    luggoUserId: user.id,
                    businessId: access.businessId,
                    roleIds,
                    branchIds,
                },
            });
            return {
                user: this.mapUserResponse(user),
                invitation: this.mapClerkInvitation(invitation),
            };
        }
        catch (error) {
            await this.usersRepository.removePendingInvitation(Number(user.id), access.businessId);
            throw this.toClerkInvitationException(error);
        }
    }
    async findAll(currentUser, branchIdValue) {
        const branchId = this.normalizeOptionalPositiveInteger(branchIdValue, 'branchId');
        const authorization = currentUser.authorization;
        if (authorization?.isSuperadmin) {
            const users = branchId === undefined
                ? await this.usersRepository.findAll()
                : await this.usersRepository.findAllByBranch(branchId);
            return users.map((user) => this.mapUserResponse(user));
        }
        const access = this.resolveUserAccess(currentUser, USER_READ_PERMISSIONS);
        if (branchId !== undefined) {
            this.assertBranchAllowedForUserManageAccess(access, branchId);
            await this.assertBranchBelongsToBusiness(branchId, access.businessId);
        }
        const users = await this.usersRepository.findAllForBusiness(access.businessId, branchId, this.getAllowedBranchIdsForUserManageAccess(access));
        return users.map((user) => this.mapUserResponse(user));
    }
    async findOne(id, currentUser) {
        const userId = this.normalizeRequiredPositiveInteger(id, 'id');
        const authorization = currentUser.authorization;
        if (authorization?.isSuperadmin) {
            return this.mapNullableUserResponse(await this.usersRepository.findById(userId));
        }
        const access = this.resolveUserAccess(currentUser, USER_READ_PERMISSIONS);
        return this.mapNullableUserResponse(await this.usersRepository.findByIdForBusiness(userId, access.businessId, this.getAllowedBranchIdsForUserManageAccess(access)));
    }
    findByClerkId(clerkId) {
        return this.usersRepository.findByClerkId(clerkId);
    }
    async findAuthenticatedByClerkId(clerkId) {
        const existingUser = await this.usersRepository.findByClerkId(clerkId);
        if (existingUser) {
            return existingUser;
        }
        const clerkProfile = await this.getClerkUserProfile(clerkId);
        return this.usersRepository.activatePendingUserFromClerk({
            clerkId,
            email: clerkProfile.email,
            name: clerkProfile.name,
            photoUrl: clerkProfile.photo_url,
        });
    }
    async update(id, updateUserDto, currentUser) {
        const userId = this.normalizeRequiredPositiveInteger(id, 'id');
        const dto = this.normalizeUpdateDto(updateUserDto);
        const authorization = currentUser.authorization;
        if (authorization?.isSuperadmin) {
            return this.mapNullableUserResponse(await this.usersRepository.update(userId, dto));
        }
        const access = this.resolveUserAccess(currentUser, USER_MANAGE_PERMISSIONS);
        if (dto.branch_id !== undefined && dto.branch_id !== null) {
            this.assertBranchAllowedForUserManageAccess(access, dto.branch_id);
            await this.assertBranchBelongsToBusiness(dto.branch_id, access.businessId);
        }
        dto.business_id = access.businessId;
        return this.mapNullableUserResponse(await this.usersRepository.updateForBusiness(userId, access.businessId, dto, this.getAllowedBranchIdsForUserManageAccess(access)));
    }
    remove(id, currentUser) {
        const userId = this.normalizeRequiredPositiveInteger(id, 'id');
        const authorization = currentUser.authorization;
        if (authorization?.isSuperadmin) {
            return this.usersRepository.remove(userId);
        }
        const access = this.resolveUserAccess(currentUser, USER_MANAGE_PERMISSIONS);
        return this.usersRepository.removeForBusiness(userId, access.businessId, this.getAllowedBranchIdsForUserManageAccess(access));
    }
    async normalizeCreateDto(createUserDto) {
        const clerkId = this.normalizeRequiredString(createUserDto.clerk_id, 'clerk_id');
        const clerkProfile = await this.getClerkUserProfile(clerkId);
        return {
            clerk_id: clerkId,
            business_id: this.normalizeNullablePositiveInteger(createUserDto.business_id, 'business_id'),
            branch_id: this.normalizeNullablePositiveInteger(createUserDto.branch_id, 'branch_id'),
            name: this.normalizeRequiredString(createUserDto.name ?? clerkProfile.name, 'name'),
            email: this.normalizeRequiredString(createUserDto.email ?? clerkProfile.email, 'email'),
            photo_url: createUserDto.photo_url !== undefined
                ? this.normalizeOptionalString(createUserDto.photo_url)
                : clerkProfile.photo_url,
            role: 'user',
            status: this.normalizeStatus(createUserDto.status ?? 'active'),
        };
    }
    normalizeUpdateDto(updateUserDto) {
        const dto = {};
        if (updateUserDto.clerk_id !== undefined) {
            dto.clerk_id = this.normalizeRequiredString(updateUserDto.clerk_id, 'clerk_id');
        }
        if (Object.prototype.hasOwnProperty.call(updateUserDto, 'business_id')) {
            dto.business_id = this.normalizeNullablePositiveInteger(updateUserDto.business_id, 'business_id');
        }
        if (Object.prototype.hasOwnProperty.call(updateUserDto, 'branch_id')) {
            dto.branch_id = this.normalizeNullablePositiveInteger(updateUserDto.branch_id, 'branch_id');
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
        if (Object.prototype.hasOwnProperty.call(updateUserDto, 'role')) {
            throw new common_1.BadRequestException('Use user roles endpoints to manage roles');
        }
        if (updateUserDto.status !== undefined) {
            dto.status = this.normalizeStatus(updateUserDto.status);
        }
        return dto;
    }
    normalizeRequiredString(value, field) {
        const normalizedValue = value?.trim();
        if (!normalizedValue) {
            throw new common_1.BadRequestException(`${field} is required`);
        }
        return normalizedValue;
    }
    normalizeEmail(value) {
        const email = this.normalizeRequiredString(String(value ?? ''), 'email')
            .trim()
            .toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new common_1.BadRequestException('email must be valid');
        }
        return email;
    }
    normalizePositiveIntegerList(values, field, requireAtLeastOne = true) {
        const normalizedValues = values
            .filter((value) => value !== undefined && value !== null && value !== '')
            .map((value) => this.normalizeRequiredPositiveInteger(value, field));
        const uniqueValues = [...new Set(normalizedValues)];
        if (requireAtLeastOne && uniqueValues.length === 0) {
            throw new common_1.BadRequestException(`${field} must include at least one id`);
        }
        return uniqueValues;
    }
    normalizeRequiredPositiveInteger(value, field) {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new common_1.BadRequestException(`${field} must be a positive integer`);
        }
        return parsed;
    }
    async getClerkUserProfile(clerkId) {
        try {
            const clerkUser = await express_1.clerkClient.users.getUser(clerkId);
            const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress ??
                clerkUser.emailAddresses[0]?.emailAddress;
            const name = clerkUser.fullName ??
                [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ??
                clerkUser.username ??
                primaryEmail;
            if (!primaryEmail) {
                throw new common_1.BadRequestException('Clerk user has no email');
            }
            return {
                name: name || primaryEmail,
                email: primaryEmail,
                photo_url: clerkUser.imageUrl || null,
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Unable to load Clerk user ${clerkId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    normalizeOptionalString(value) {
        if (value === undefined || value === null) {
            return null;
        }
        const normalizedValue = value.trim();
        return normalizedValue.length === 0 ? null : normalizedValue;
    }
    normalizeNullablePositiveInteger(value, field) {
        if (value === undefined || value === null) {
            return null;
        }
        if (!Number.isInteger(value) || value <= 0) {
            throw new common_1.BadRequestException(`${field} must be a positive integer`);
        }
        return value;
    }
    normalizeOptionalPositiveInteger(value, field) {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new common_1.BadRequestException(`${field} must be a positive integer`);
        }
        return parsed;
    }
    requireBusinessUserBusinessId(businessId) {
        if (businessId === undefined || businessId === null || businessId === '') {
            throw new common_1.ForbiddenException('User must belong to a business');
        }
        return this.normalizeOptionalPositiveInteger(businessId, 'businessId');
    }
    async assertBranchBelongsToBusiness(branchId, businessId) {
        const belongs = await this.usersRepository.branchBelongsToBusiness(branchId, businessId);
        if (!belongs) {
            throw new common_1.ForbiddenException('Branch does not belong to business');
        }
    }
    resolveUserAccess(currentUser, permissionKeys) {
        const authorization = currentUser.authorization;
        if (!authorization) {
            throw new common_1.ForbiddenException('Authorization context is required');
        }
        const accessScope = this.resolveAccessScope(authorization.permissions, permissionKeys);
        if (!accessScope) {
            throw new common_1.ForbiddenException(`Missing permission ${permissionKeys.join(' or ')}`);
        }
        const businessId = this.requireBusinessUserBusinessId(authorization.businessId);
        return {
            businessId,
            accessScope,
            branchIds: authorization.branchIds,
        };
    }
    resolveAccessScope(permissions, permissionKeys) {
        for (const permissionKey of permissionKeys) {
            const accessScope = permissions[permissionKey];
            if (accessScope) {
                return accessScope;
            }
        }
        return null;
    }
    assertBranchScopeAllowsInvite(access, branchIds) {
        if (access.accessScope === 'business') {
            return;
        }
        if (branchIds.length === 0) {
            throw new common_1.BadRequestException('branch_ids is required for branch-scoped user management');
        }
        for (const branchId of branchIds) {
            if (!access.branchIds.includes(branchId)) {
                throw new common_1.ForbiddenException('Branch is not assigned to user');
            }
        }
    }
    getAllowedBranchIdsForUserManageAccess(access) {
        return access.accessScope === 'business' ? undefined : access.branchIds;
    }
    assertBranchAllowedForUserManageAccess(access, branchId) {
        if (access.accessScope === 'business') {
            return;
        }
        if (!access.branchIds.includes(branchId)) {
            throw new common_1.ForbiddenException('Branch is not assigned to user');
        }
    }
    async assertBranchesBelongToBusiness(branchIds, businessId) {
        const existingBranchIds = await this.usersRepository.findBranchIdsForBusiness(branchIds, businessId);
        if (existingBranchIds.length !== branchIds.length) {
            throw new common_1.NotFoundException('One or more branches were not found');
        }
    }
    async assertRolesAvailableForBusiness(roleIds, businessId) {
        const roles = await this.usersRepository.findAvailableActiveRolesByIds(roleIds, businessId);
        const availableRoleIds = new Set(roles.map((role) => Number(role.id)));
        if (availableRoleIds.size !== roleIds.length) {
            throw new common_1.NotFoundException('One or more roles were not found');
        }
    }
    mapClerkInvitation(invitation) {
        return {
            id: invitation.id,
            emailAddress: invitation.emailAddress,
            status: invitation.status,
            url: invitation.url,
        };
    }
    mapNullableUserResponse(user) {
        return user ? this.mapUserResponse(user) : null;
    }
    mapUserResponse(user) {
        const { role: _legacyRole, authorization: _authorization, ...response } = user;
        return {
            ...response,
            roles: user.roles ?? [],
        };
    }
    toClerkInvitationException(error) {
        const message = error instanceof Error ? error.message : String(error);
        if (/already|exists|duplicate|invited/i.test(message)) {
            return new common_1.ConflictException(`Unable to create Clerk invitation: ${message}`);
        }
        return new common_1.BadRequestException(`Unable to create Clerk invitation: ${message}`);
    }
    normalizeStatus(status) {
        const normalizedStatus = status?.trim().toLowerCase();
        if (normalizedStatus !== 'active' && normalizedStatus !== 'inactive') {
            throw new common_1.BadRequestException('status must be one of: active, inactive');
        }
        return normalizedStatus;
    }
    isUniqueViolation(error) {
        return (typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === '23505');
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_repository_1.UsersRepository])
], UsersService);
//# sourceMappingURL=users.service.js.map