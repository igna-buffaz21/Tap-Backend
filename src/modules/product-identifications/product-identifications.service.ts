import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import type {
  RfidFlowResult,
  RfidProductFlowResult,
} from '../esp32/types/esp32.types';
import { ProductIdentificationsRepository } from './product-identifications.repository';
import { CreateProductIdentificationDto } from './types/dto/create-product-identification.dto';
import { FindProductIdentificationsDto } from './types/dto/find-product-identifications.dto';
import { UpdateProductIdentificationDto } from './types/dto/update-product-identification.dto';
import { PRODUCT_IDENTIFICATION_TYPES } from './types/product-identification.types';
import type { ProductIdentificationType } from './types/product-identification.types';

@Injectable()
export class ProductIdentificationsService {
  constructor(private readonly repository: ProductIdentificationsRepository) {}

  async resolveRfidFlowForBusiness(
    currentUser: User,
    scan: () => Promise<RfidFlowResult>,
  ): Promise<RfidProductFlowResult> {
    // Resolve authorization before the callback can move the door.
    const businessId = this.resolveBusinessId(currentUser);
    const flow = await scan();
    const epcs = [...new Set(flow.epcs)];
    const codes = epcs.map((epc) =>
      /^[0-9a-f]{24}$/i.test(epc) ? this.normalizeValue(epc, 'RFID_UHF') : null,
    );
    const values = [
      ...new Set(codes.filter((code): code is string => code !== null)),
    ];
    const rows = values.length
      ? await this.repository.findProductsByRfidValuesForBusiness(
          businessId,
          values,
        )
      : [];
    const productsByCode = new Map(
      rows.map(({ identification_value, ...product }) => [
        identification_value,
        product,
      ]),
    );
    return {
      products: epcs.map((epc, index) => ({
        epc,
        product: productsByCode.get(codes[index] ?? '') ?? null,
      })),
      total: epcs.length,
      door: flow.door,
    };
  }

  async createForBusiness(
    dto: CreateProductIdentificationDto,
    currentUser: User,
  ) {
    const businessId = this.resolveBusinessId(currentUser);
    if (!dto || typeof dto !== 'object' || Array.isArray(dto)) {
      throw new BadRequestException(
        'A product identification body is required',
      );
    }
    const type = this.normalizeType(dto.type);
    const normalized: CreateProductIdentificationDto = {
      product_id: this.parseId(dto.product_id, 'product_id'),
      type,
      value: this.normalizeValue(dto.value, type),
    };
    try {
      const identification = await this.repository.createForBusiness(
        businessId,
        normalized,
      );
      if (!identification) {
        throw new NotFoundException('Product not found for business');
      }
      return identification;
    } catch (error) {
      this.rethrowPersistenceError(error);
    }
  }

  findAllForBusiness(
    filters: FindProductIdentificationsDto,
    currentUser: User,
  ) {
    const businessId = this.resolveBusinessId(currentUser);
    const type =
      filters.type === undefined ? undefined : this.normalizeType(filters.type);
    return this.repository.findAllForBusiness(businessId, {
      product_id:
        filters.product_id === undefined
          ? undefined
          : this.parseId(filters.product_id, 'product_id'),
      type,
      value:
        filters.value === undefined
          ? undefined
          : this.normalizeValue(filters.value, type),
    });
  }

  async findOneForBusiness(id: number | string, currentUser: User) {
    const businessId = this.resolveBusinessId(currentUser);
    const identification = await this.repository.findByIdForBusiness(
      this.parseId(id, 'id'),
      businessId,
    );
    if (!identification) {
      throw new NotFoundException(
        'Product identification not found for business',
      );
    }
    return identification;
  }

  async updateForBusiness(
    id: number | string,
    dto: UpdateProductIdentificationDto,
    currentUser: User,
  ) {
    const businessId = this.resolveBusinessId(currentUser);
    const identificationId = this.parseId(id, 'id');
    if (!dto || typeof dto !== 'object' || Array.isArray(dto)) {
      throw new BadRequestException(
        'A product identification body is required',
      );
    }
    const normalized: UpdateProductIdentificationDto = {
      product_id:
        dto.product_id === undefined
          ? undefined
          : this.parseId(dto.product_id, 'product_id'),
      type: dto.type === undefined ? undefined : this.normalizeType(dto.type),
      value:
        dto.value === undefined ? undefined : this.normalizeValue(dto.value),
    };
    if (Object.values(normalized).every((value) => value === undefined)) {
      throw new BadRequestException(
        'At least one of product_id, type or value is required',
      );
    }
    const current = await this.repository.findByIdForBusiness(
      identificationId,
      businessId,
    );
    if (!current) {
      throw new NotFoundException(
        'Product identification not found for business',
      );
    }
    // A partial edit must use the stored type, including edits of type alone.
    normalized.value = this.normalizeValue(
      normalized.value ?? current.value,
      normalized.type ?? current.type,
    );
    try {
      const identification = await this.repository.updateForBusiness(
        identificationId,
        businessId,
        normalized,
        current,
      );
      if (!identification) {
        const latest = await this.repository.findByIdForBusiness(
          identificationId,
          businessId,
        );
        if (
          latest &&
          (latest.type !== current.type || latest.value !== current.value)
        ) {
          throw new ConflictException(
            'Product identification changed; retry the update',
          );
        }
        throw new NotFoundException(
          'Product identification or product not found for business',
        );
      }
      return identification;
    } catch (error) {
      this.rethrowPersistenceError(error);
    }
  }

  async removeForBusiness(
    id: number | string,
    currentUser: User,
  ): Promise<void> {
    const businessId = this.resolveBusinessId(currentUser);
    const removed = await this.repository.removeForBusiness(
      this.parseId(id, 'id'),
      businessId,
    );
    if (!removed) {
      throw new NotFoundException(
        'Product identification not found for business',
      );
    }
  }

  private resolveBusinessId(currentUser: User): number {
    const businessId = currentUser?.authorization?.businessId;
    if (
      typeof businessId !== 'number' ||
      !Number.isSafeInteger(businessId) ||
      businessId <= 0
    ) {
      throw new ForbiddenException('User must have an authorized business');
    }
    return businessId;
  }

  private parseId(value: unknown, field: string): number {
    if (
      (typeof value !== 'number' &&
        (typeof value !== 'string' || !/^\d+$/.test(value))) ||
      !Number.isSafeInteger(Number(value)) ||
      Number(value) <= 0
    ) {
      throw new BadRequestException(`${field} must be a positive safe integer`);
    }
    return Number(value);
  }

  private normalizeType(value: unknown): ProductIdentificationType {
    const type = typeof value === 'string' ? value.trim().toUpperCase() : '';
    if (
      !PRODUCT_IDENTIFICATION_TYPES.includes(type as ProductIdentificationType)
    ) {
      throw new BadRequestException('type must be RFID_UHF, EAN_13 or QR');
    }
    return type as ProductIdentificationType;
  }

  private normalizeValue(
    value: unknown,
    type?: ProductIdentificationType,
  ): string {
    if (
      typeof value !== 'string' ||
      !value.trim() ||
      Array.from(value.trim()).length > 255
    ) {
      throw new BadRequestException(
        'value must be a non-empty string of at most 255 characters',
      );
    }
    const normalized = value.trim();
    if (type !== 'RFID_UHF') return normalized;

    if (!/^(?:[0-9a-f]{8}|[0-9a-f]{24})$/i.test(normalized)) {
      throw new BadRequestException(
        'RFID_UHF value must be an 8-character hexadecimal product identifier or a 24-character hexadecimal EPC (4 prefix + 8 product + 12 serial)',
      );
    }
    // Keep leading zeroes; the prefix and serial do not identify the product.
    return (
      normalized.length === 24 ? normalized.slice(4, 12) : normalized
    ).toUpperCase();
  }

  private rethrowPersistenceError(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505' &&
      'constraint' in error &&
      error.constraint === 'uq_product_identification'
    ) {
      throw new ConflictException(
        'Product identification type and value already exist for business',
      );
    }
    throw error;
  }
}
