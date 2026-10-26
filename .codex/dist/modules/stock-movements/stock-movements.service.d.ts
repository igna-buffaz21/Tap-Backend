import { User } from '../users/entities/user.entity';
import { CreateBulkStockMovementDto } from './dto/create-bulk-stock-movement.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { StockMovement } from './entities/stock-movement.entity';
import { StockMovementsRepository } from './stock-movements.repository';
export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export interface PaginatedStockMovementsResponse {
    data: StockMovement[];
    pagination: Pagination;
}
export declare class StockMovementsService {
    private readonly stockMovementsRepository;
    constructor(stockMovementsRepository: StockMovementsRepository);
    createForBusiness(createMovementDto: CreateStockMovementDto, currentUser: User): Promise<StockMovement>;
    createBulkForBusiness(createBulkMovementDto: CreateBulkStockMovementDto, currentUser: User): Promise<{
        count: number;
        movements: StockMovement[];
    }>;
    findAllForBusiness(currentUser: User, branchIdValue?: unknown, productIdValue?: unknown, userIdValue?: unknown, categoryIdValue?: unknown, typeValue?: unknown, pageValue?: unknown, limitValue?: unknown): Promise<PaginatedStockMovementsResponse>;
    findOneForBusiness(id: number, currentUser: User): Promise<StockMovement>;
    private resolveStockAccess;
    private requireBusinessUserBusinessId;
    private assertBranchBelongsToBusiness;
    private assertProductBelongsToBusiness;
    private assertUserBelongsToBusiness;
    private assertCategoryBelongsToBusiness;
    private normalizeCreateDto;
    private normalizeBulkCreateDto;
    private normalizeBulkItems;
    private parsePositiveInteger;
    private parseOptionalPositiveInteger;
    private parsePagination;
    private buildPaginatedResponse;
    private buildPagination;
    private parsePositiveNumber;
    private parseNonNegativeNumber;
    private parseOptionalNonNegativeNumber;
    private normalizeOptionalString;
    private normalizeMovementType;
    private normalizeOptionalMovementType;
    private normalizeBulkMovementType;
    private normalizeOptionalMovementReason;
}
