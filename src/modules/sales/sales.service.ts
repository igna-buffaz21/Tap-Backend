import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationScopeService } from '../auth/authorization-scope.service';
import { User } from '../users/entities/user.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import {
  CreateSaleRecord,
  SaleAccessFilter,
  SaleInsufficientStockError,
  SaleProductPrice,
  SalesRepository,
} from './sales.repository';

interface SaleAccess {
  businessId: number;
  userId: number;
  filter?: SaleAccessFilter;
}

interface CreateSaleDraft {
  branch_id: number;
  customer_id: number | null;
  discount_amount: number;
  notes: string | null;
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
}

@Injectable()
export class SalesService {
  constructor(
    private readonly salesRepository: SalesRepository,
    private readonly authorizationScope: AuthorizationScopeService,
  ) {}

  async createForBusiness(
    createSaleDto: CreateSaleDto,
    currentUser: User,
    businessIdValue?: unknown,
  ) {
    // Leemos del token el negocio, el usuario y el alcance que puede operar.
    const access = this.resolveSaleAccess(currentUser, businessIdValue);
    // Validamos y normalizamos el body antes de usarlo en cualquier consulta.
    const sale = this.normalizeCreateDto(createSaleDto);

    // Confirmamos que la sucursal pertenece al negocio y está permitida por el alcance del usuario.
    await this.assertBranchBelongsToBusiness(
      sale.branch_id,
      access.businessId,
      access.filter,
    );

    // Si la venta tiene cliente, comprobamos que sea del mismo negocio.
    if (sale.customer_id !== null) {
      const customerBelongs =
        await this.salesRepository.customerBelongsToBusiness(
          sale.customer_id,
          access.businessId,
        );

      if (!customerBelongs) {
        throw new ForbiddenException('Customer does not belong to business');
      }
    }

    // Obtenemos una sola vez los productos únicos solicitados para validar propiedad y precios.
    const productIds = [...new Set(sale.items.map((item) => item.product_id))];
    const products = await this.salesRepository.findProductsForSale(
      productIds,
      access.businessId,
    );

    // Si falta algún producto, no permitimos vender artículos de otro negocio o inexistentes.
    if (products.length !== productIds.length) {
      throw new ForbiddenException(
        'One or more products do not belong to business',
      );
    }

    try {
      // Calculamos los precios desde product y ejecutamos la transacción completa de la venta.
      const created = await this.salesRepository.withTransaction(
        async (client) => {
          const branch = await this.salesRepository.findBranchStockSettings(
            client,
            sale.branch_id,
            access.businessId,
          );
          if (!branch) throw new NotFoundException('Branch not found');

          if (branch.sales_stock_enabled) {
            const availability = await this.salesRepository.validateStock(
              client,
              access.businessId,
              sale.branch_id,
              sale.items,
            );
            if (!availability.available) {
              throw new SaleInsufficientStockError(
                availability.productId,
                availability.availableQuantity,
                availability.requestedQuantity,
              );
            }
          }

          const createdSale = await this.salesRepository.createInTransaction(
            client,
            access.businessId,
            access.userId,
            this.applyProductPrices(sale, products),
          );

          if (branch.sales_stock_enabled) {
            await this.salesRepository.applyStockMovement(
              client,
              access.businessId,
              {
                branch_id: sale.branch_id,
                type: 'OUT',
                reason: 'SALE',
                notes: `Venta #${createdSale.id}`,
                items: sale.items.map((item) => ({
                  product_id: item.product_id,
                  quantity: item.quantity,
                  unit_cost: null,
                })),
              },
              access.userId,
            );
          }

          return createdSale;
        },
      );
      return created;
    } catch (error) {
      // Convertimos el faltante de stock en una respuesta clara para el frontend.
      if (error instanceof SaleInsufficientStockError) {
        throw new BadRequestException(
          `Insufficient stock for product ${error.productId}: requested ${error.requestedQuantity}, available ${error.availableQuantity}`,
        );
      }

      // Dejamos pasar cualquier otro error para que NestJS lo trate de forma normal.
      throw error;
    }
  }

  async findOneForBusiness(
    id: number,
    currentUser: User,
    businessIdValue?: unknown,
  ) {
    const saleId = this.parsePositiveInteger(id, 'id');
    const access = this.resolveSaleAccess(currentUser, businessIdValue);
    const sale = await this.salesRepository.findByIdForBusiness(
      saleId,
      access.businessId,
      access.filter,
    );

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    return sale;
  }

  async findAllForBusiness(
    currentUser: User,
    businessIdValue?: unknown,
    pageValue?: unknown,
    limitValue?: unknown,
  ) {
    // Resolvemos el negocio y las restricciones del token antes de consultar el listado.
    const access = this.resolveSaleAccess(currentUser, businessIdValue);
    const page =
      pageValue === undefined || pageValue === null || pageValue === ''
        ? 1
        : this.parsePositiveInteger(pageValue, 'page');
    const limit =
      limitValue === undefined || limitValue === null || limitValue === ''
        ? 10
        : this.parsePositiveInteger(limitValue, 'limit');

    if (limit > 100) {
      throw new BadRequestException('limit must be less than or equal to 100');
    }

    const offset = (page - 1) * limit;
    if (!Number.isSafeInteger(page) || !Number.isSafeInteger(offset)) {
      throw new BadRequestException('page is too large');
    }

    // El repositorio aplica business_id y, si corresponde, sucursal o creador de la venta.
    const result = await this.salesRepository.findAllForBusiness(
      access.businessId,
      access.filter,
      { limit, offset },
    );

    return {
      data: result.sales,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  async cancelForBusiness(
    id: number,
    currentUser: User,
    businessIdValue?: unknown,
  ) {
    // Validamos el id recibido antes de abrir la transacción de anulación.
    const saleId = this.parsePositiveInteger(id, 'id');
    // Tomamos negocio, usuario y alcance desde el token autenticado.
    const access = this.resolveSaleAccess(currentUser, businessIdValue);
    // Decidimos la reposición sobre la venta bloqueada, dentro de la transacción de anulación.
    const result = await this.salesRepository.cancelForBusiness(
      saleId,
      access.businessId,
      async (client, sale) => {
        if (
          await this.salesRepository.hasSaleStockMovement(
            client,
            access.businessId,
            sale,
          )
        ) {
          await this.salesRepository.applyStockMovement(
            client,
            access.businessId,
            {
              branch_id: Number(sale.branch_id),
              type: 'IN',
              reason: 'SALE_CANCELLATION',
              notes: `Anulación de venta #${sale.id}`,
              items: sale.items.map((item) => ({
                product_id: Number(item.product_id),
                quantity: item.quantity,
                unit_cost: null,
              })),
            },
            access.userId,
          );
        }
      },
      access.filter,
    );

    // Si todo salió bien, devolvemos la venta con estado CANCELLED y sus items originales.
    if (result.status === 'cancelled') {
      return result.sale;
    }

    // Si la venta no se encontró dentro del negocio y alcance del usuario, respondemos 404.
    if (result.status === 'not_found') {
      throw new NotFoundException('Sale not found');
    }

    // Si ya estaba anulada, respondemos 409 y no duplicamos la reposición de stock.
    throw new ConflictException('Sale is already cancelled');
  }

  private resolveSaleAccess(
    currentUser: User,
    businessIdValue?: unknown,
  ): SaleAccess {
    const authorization =
      this.authorizationScope.requireAuthorization(currentUser);
    const permission = this.authorizationScope.requirePermission(
      currentUser,
      'stock.manage',
    );
    const businessId = this.authorizationScope.resolveBusinessId(
      currentUser,
      businessIdValue,
    );
    const allowedBranchIds = this.authorizationScope.getAllowedBranchIds(
      currentUser,
      'stock.manage',
    );

    return {
      businessId,
      userId: authorization.userId,
      filter:
        allowedBranchIds === undefined && permission.access_scope !== 'own'
          ? undefined
          : {
              allowedBranchIds,
              createdByUserId:
                permission.access_scope === 'own'
                  ? authorization.userId
                  : undefined,
            },
    };
  }

  private async assertBranchBelongsToBusiness(
    branchId: number,
    businessId: number,
    accessFilter?: SaleAccessFilter,
  ): Promise<void> {
    const belongs = await this.salesRepository.branchBelongsToBusinessAndAccess(
      branchId,
      businessId,
      accessFilter,
    );

    if (!belongs) {
      throw new ForbiddenException('Branch does not belong to business');
    }
  }

  private normalizeCreateDto(dto: CreateSaleDto): CreateSaleDraft {
    if ('payment' in dto)
      throw new BadRequestException(
        'Register payments through the payments endpoint',
      );
    if (!Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('items must contain at least one item');
    }

    const items = dto.items.map((item, index) => {
      const quantity = this.parsePositiveNumber(
        item?.quantity,
        `items[${index}].quantity`,
        3,
      );
      return {
        product_id: this.parsePositiveInteger(
          item?.product_id,
          `items[${index}].product_id`,
        ),
        quantity,
      };
    });
    const discountAmount = this.parseNonNegativeNumber(
      dto.discount_amount ?? 0,
      'discount_amount',
      2,
    );

    return {
      branch_id: this.parsePositiveInteger(dto.branch_id, 'branch_id'),
      customer_id: this.parseNullablePositiveInteger(
        dto.customer_id,
        'customer_id',
      ),
      discount_amount: discountAmount,
      notes: this.parseNullableString(dto.notes, 'notes'),
      items,
    };
  }

  private applyProductPrices(
    sale: CreateSaleDraft,
    products: SaleProductPrice[],
  ): CreateSaleRecord {
    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );
    const items = sale.items.map((item) => {
      const price = productsById.get(item.product_id)?.sale_price;

      if (price === null || price === undefined) {
        throw new BadRequestException(
          `Product ${item.product_id} does not have a sale price`,
        );
      }

      return {
        ...item,
        unit_price: price,
        subtotal: this.roundToScale(item.quantity * price, 2),
      };
    });
    const subtotal = this.roundToScale(
      items.reduce((sum, item) => sum + item.subtotal, 0),
      2,
    );

    if (sale.discount_amount > subtotal) {
      throw new BadRequestException(
        'discount_amount cannot exceed the sale subtotal',
      );
    }

    return { ...sale, items };
  }

  private parsePositiveInteger(value: unknown, field: string): number {
    const parsed = Number(value);

    if (
      value === undefined ||
      value === null ||
      value === '' ||
      !Number.isInteger(parsed) ||
      parsed <= 0
    ) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }

    return parsed;
  }

  private parseNullablePositiveInteger(
    value: unknown,
    field: string,
  ): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    return this.parsePositiveInteger(value, field);
  }

  private parsePositiveNumber(
    value: unknown,
    field: string,
    scale: number,
  ): number {
    const parsed = this.parseNumber(value, field, scale);

    if (parsed <= 0) {
      throw new BadRequestException(`${field} must be a positive number`);
    }

    return parsed;
  }

  private parseNonNegativeNumber(
    value: unknown,
    field: string,
    scale: number,
  ): number {
    const parsed = this.parseNumber(value, field, scale);

    if (parsed < 0) {
      throw new BadRequestException(`${field} must be a non-negative number`);
    }

    return parsed;
  }

  private parseNumber(value: unknown, field: string, scale: number): number {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`${field} is required`);
    }

    const parsed = Number(value);
    const factor = 10 ** scale;

    if (
      !Number.isFinite(parsed) ||
      Math.abs(parsed * factor - Math.round(parsed * factor)) > 1e-8
    ) {
      throw new BadRequestException(
        `${field} must be a number with at most ${scale} decimal places`,
      );
    }

    return this.roundToScale(parsed, scale);
  }

  private parseNullableString(value: unknown, field: string): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${field} must be a string or null`);
    }

    const normalized = value.trim();
    return normalized || null;
  }

  private roundToScale(value: number, scale: number): number {
    const factor = 10 ** scale;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
}
