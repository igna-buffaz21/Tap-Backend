import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  buildPhoneLookupCandidates,
  normalizePhone,
} from '../../common/utils/phone';
import { AuthorizationScopeService } from '../auth/authorization-scope.service';
import { User } from '../users/entities/user.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UpdateCustomerStatusDto } from './dto/update-customer-status.dto';
import { CustomerStatus } from './entities/customer.entity';
import { CustomersRepository } from './customers.repository';

@Injectable()
export class CustomersService {
  constructor(
    private readonly customersRepository: CustomersRepository,
    private readonly authorizationScope: AuthorizationScopeService,
  ) {}

  async createForBusiness(
    dto: CreateCustomerDto,
    user: User,
    businessIdValue?: unknown,
  ) {
    const businessId = this.resolveBusinessId(user, businessIdValue);
    if (!(await this.customersRepository.businessExists(businessId)))
      throw new NotFoundException('Business not found');
    const normalized = this.normalizeUpdateDto(dto);
    if (
      normalized.phone &&
      (await this.customersRepository.findByPhonesForBusiness(
        buildPhoneLookupCandidates(normalized.phone),
        businessId,
      ))
    ) {
      throw new ConflictException(
        'Ya existe un cliente con ese teléfono en el negocio',
      );
    }
    return this.customersRepository.create(
      businessId,
      normalized as CreateCustomerDto,
    );
  }

  async getStatsForBusiness(user: User, businessIdValue?: unknown) {
    const businessId = this.resolveBusinessId(user, businessIdValue);
    const row = await this.customersRepository.getStatsForBusiness(businessId);
    return {
      businessId,
      totalCustomers: Number(row.total_customers),
      newCustomersThisMonth: Number(row.new_customers_this_month),
    };
  }

  async findAllForBusiness(
    user: User,
    businessIdValue?: unknown,
    pageValue?: unknown,
    limitValue?: unknown,
    searchValue?: unknown,
    statusValue?: unknown,
  ) {
    const businessId = this.resolveBusinessId(user, businessIdValue);
    const page =
      pageValue === undefined
        ? 1
        : this.authorizationScope.parsePositiveInteger(pageValue, 'page');
    const limit =
      limitValue === undefined
        ? 20
        : this.authorizationScope.parsePositiveInteger(limitValue, 'limit');
    const offset = (page - 1) * limit;
    if (limit > 100 || !Number.isSafeInteger(offset))
      throw new BadRequestException('Invalid pagination');
    if (searchValue !== undefined && typeof searchValue !== 'string')
      throw new BadRequestException('search must be a string');
    const search =
      typeof searchValue === 'string' && searchValue.trim()
        ? '%' + searchValue.trim().replace(/[\\%_]/g, '\\$&') + '%'
        : null;
    const status = this.normalizeStatus(statusValue ?? 'ACTIVE');
    const result = await this.customersRepository.findPageForBusiness(
      businessId,
      limit,
      offset,
      search,
      status,
    );
    return {
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  async findOneForBusiness(id: number, user: User, businessIdValue?: unknown) {
    const businessId = this.resolveBusinessId(user, businessIdValue);
    const customer = await this.customersRepository.findByIdForBusiness(
      this.authorizationScope.parsePositiveInteger(id, 'id'),
      businessId,
    );
    if (!customer)
      throw new NotFoundException('Customer not found for business');
    return customer;
  }

  findByPhoneForBusiness(
    phone: unknown,
    user: User,
    businessIdValue?: unknown,
  ) {
    const businessId = this.resolveBusinessId(user, businessIdValue);
    if (typeof phone !== 'string' || !normalizePhone(phone))
      throw new BadRequestException('phone is required');
    return this.customersRepository.findByPhonesForBusiness(
      buildPhoneLookupCandidates(phone),
      businessId,
    );
  }

  async updateForBusiness(
    id: number,
    dto: UpdateCustomerDto,
    user: User,
    businessIdValue?: unknown,
  ) {
    const businessId = this.resolveBusinessId(user, businessIdValue);
    const customerId = this.authorizationScope.parsePositiveInteger(id, 'id');
    const normalized = this.normalizeUpdateDto(dto);
    if (normalized.phone) {
      const existing = await this.customersRepository.findByPhonesForBusiness(
        buildPhoneLookupCandidates(normalized.phone),
        businessId,
      );
      if (existing && Number(existing.id) !== customerId)
        throw new ConflictException(
          'Ya existe un cliente con ese teléfono en el negocio',
        );
    }
    const customer = await this.customersRepository.updateForBusiness(
      customerId,
      businessId,
      normalized,
    );
    if (!customer)
      throw new NotFoundException('Customer not found for business');
    return customer;
  }

  async updateStatusForBusiness(
    id: number,
    dto: UpdateCustomerStatusDto,
    user: User,
    businessIdValue?: unknown,
  ) {
    const businessId = this.resolveBusinessId(user, businessIdValue);
    const customer = await this.customersRepository.updateStatusForBusiness(
      this.authorizationScope.parsePositiveInteger(id, 'id'),
      businessId,
      this.normalizeStatus(dto.status),
    );
    if (!customer)
      throw new NotFoundException('Customer not found for business');
    return customer;
  }

  private resolveBusinessId(user: User, requestedBusinessId?: unknown): number {
    return this.authorizationScope.resolveBusinessId(user, requestedBusinessId);
  }

  private normalizeUpdateDto(dto: UpdateCustomerDto): UpdateCustomerDto {
    if (
      !dto ||
      Object.keys(dto).some((key) => !['name', 'phone', 'email'].includes(key))
    )
      throw new BadRequestException('Unsupported customer fields');
    const normalized: UpdateCustomerDto = {};
    for (const key of ['name', 'phone', 'email'] as const) {
      if (dto[key] === undefined) continue;
      if (typeof dto[key] !== 'string')
        throw new BadRequestException(`${key} must be a string`);
      normalized[key] = dto[key].trim();
    }
    if (normalized.phone !== undefined) {
      normalized.phone = normalizePhone(normalized.phone);
      if (!normalized.phone) throw new BadRequestException('phone is required');
    }
    if (normalized.email) {
      normalized.email = normalized.email.toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email))
        throw new BadRequestException('email must be valid');
    }
    return normalized;
  }

  private normalizeStatus(value: unknown): CustomerStatus {
    if (
      typeof value !== 'string' ||
      !['ACTIVE', 'INACTIVE'].includes(value.toUpperCase())
    )
      throw new BadRequestException('status must be ACTIVE or INACTIVE');
    return value.toUpperCase() as CustomerStatus;
  }
}
