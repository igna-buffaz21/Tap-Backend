import { DatabaseService } from '../../database/database.service';
import { CreateResourceScheduleDto } from './dto/create-resource-schedule.dto';
import { UpdateResourceScheduleDto } from './dto/update-resource-schedule.dto';
import { ResourceSchedule } from './entities/resource-schedule.entity';
export interface ResourceScheduleAccessFilter {
    allowedBranchIds?: number[];
}
export declare class ResourceSchedulesRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    create(createResourceScheduleDto: CreateResourceScheduleDto): Promise<ResourceSchedule>;
    findAll(): Promise<ResourceSchedule[]>;
    findAllForBusiness(businessId: number, accessFilter?: ResourceScheduleAccessFilter): Promise<ResourceSchedule[]>;
    findById(id: number): Promise<ResourceSchedule | null>;
    update(id: number, updateResourceScheduleDto: UpdateResourceScheduleDto, businessId?: number, accessFilter?: ResourceScheduleAccessFilter): Promise<ResourceSchedule | null>;
    findByIdForBusiness(id: number, businessId: number, accessFilter?: ResourceScheduleAccessFilter): Promise<ResourceSchedule | null>;
    resourceBelongsToBusiness(resourceId: number, businessId: number): Promise<boolean>;
    resourceBelongsToBusinessAndAccess(resourceId: number, businessId: number, accessFilter?: ResourceScheduleAccessFilter): Promise<boolean>;
    remove(id: number, businessId?: number, accessFilter?: ResourceScheduleAccessFilter): Promise<boolean>;
    private buildBranchAccessCondition;
}
