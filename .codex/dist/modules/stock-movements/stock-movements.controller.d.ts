import { User } from '../users/entities/user.entity';
import { CreateBulkStockMovementDto } from './dto/create-bulk-stock-movement.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { StockMovementsService } from './stock-movements.service';
export declare class StockMovementsController {
    private readonly stockMovementsService;
    constructor(stockMovementsService: StockMovementsService);
    create(createMovementDto: CreateStockMovementDto, currentUser: User): Promise<import("./entities/stock-movement.entity").StockMovement>;
    createBulk(createBulkMovementDto: CreateBulkStockMovementDto, currentUser: User): Promise<{
        count: number;
        movements: import("./entities/stock-movement.entity").StockMovement[];
    }>;
    findAll(currentUser: User, branchId?: string, productId?: string, userId?: string, categoryId?: string, type?: string, page?: string, limit?: string): Promise<import("./stock-movements.service").PaginatedStockMovementsResponse>;
    findOne(id: string, currentUser: User): Promise<import("./entities/stock-movement.entity").StockMovement>;
}
