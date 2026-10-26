import { DatabaseService } from '../../database/database.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './entities/service.entity';
export interface ServiceAccessFilter {
    allowedBranchIds?: number[];
}
export declare class ServicesRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    create(createServiceDto: CreateServiceDto): Promise<Service>;
    findAll(): Promise<Service[]>;
    findAllForBusiness(businessId: number, accessFilter?: ServiceAccessFilter): Promise<Service[]>;
    findById(id: number): Promise<Service | null>;
    update(id: number, updateServiceDto: UpdateServiceDto, businessId?: number, accessFilter?: ServiceAccessFilter): Promise<Service | null>;
    findByIdForBusiness(id: number, businessId: number, accessFilter?: ServiceAccessFilter): Promise<Service | null>;
    branchBelongsToBusiness(branchId: number, businessId: number): Promise<boolean>;
    branchBelongsToBusinessAndAccess(branchId: number, businessId: number, accessFilter?: ServiceAccessFilter): Promise<boolean>;
    remove(id: number): Promise<boolean>;
    private buildBranchAccessCondition;
}
