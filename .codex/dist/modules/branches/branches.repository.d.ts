import { DatabaseService } from '../../database/database.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Branch } from './entities/branch.entity';
export declare class BranchesRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    create(createBranchDto: CreateBranchDto): Promise<Branch>;
    findAll(): Promise<Branch[]>;
    findAllForBusiness(businessId: number, allowedBranchIds?: number[]): Promise<Branch[]>;
    findById(id: number): Promise<Branch | null>;
    update(id: number, updateBranchDto: UpdateBranchDto, businessId?: number): Promise<Branch | null>;
    findByIdForBusiness(id: number, businessId: number, allowedBranchIds?: number[]): Promise<Branch | null>;
    remove(id: number): Promise<boolean>;
    removeForBusiness(id: number, businessId: number): Promise<boolean>;
    private buildBranchAccessCondition;
    private mapBranch;
    private mapNullableNumber;
    private mapOpeningHours;
}
