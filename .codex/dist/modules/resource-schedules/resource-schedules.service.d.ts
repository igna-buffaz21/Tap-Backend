import { User } from '../users/entities/user.entity';
import { CreateResourceScheduleDto } from './dto/create-resource-schedule.dto';
import { UpdateResourceScheduleDto } from './dto/update-resource-schedule.dto';
import { ResourceScheduleAccessFilter, ResourceSchedulesRepository } from './resource-schedules.repository';
export declare class ResourceSchedulesService {
    private readonly resourceSchedulesRepository;
    constructor(resourceSchedulesRepository: ResourceSchedulesRepository);
    create(createResourceScheduleDto: CreateResourceScheduleDto): Promise<import("./entities/resource-schedule.entity").ResourceSchedule>;
    createForBusiness(createResourceScheduleDto: CreateResourceScheduleDto, currentUser: User, businessIdValue?: unknown): Promise<import("./entities/resource-schedule.entity").ResourceSchedule>;
    findAll(): Promise<import("./entities/resource-schedule.entity").ResourceSchedule[]>;
    findAllForBusiness(currentUser: User, businessIdValue?: unknown): Promise<import("./entities/resource-schedule.entity").ResourceSchedule[]>;
    findOne(id: number): Promise<import("./entities/resource-schedule.entity").ResourceSchedule | null>;
    findOneForBusiness(id: number, currentUser: User, businessIdValue?: unknown): Promise<import("./entities/resource-schedule.entity").ResourceSchedule>;
    update(id: number, updateResourceScheduleDto: UpdateResourceScheduleDto, businessId?: number, accessFilter?: ResourceScheduleAccessFilter): Promise<import("./entities/resource-schedule.entity").ResourceSchedule | null>;
    updateForBusiness(id: number, updateResourceScheduleDto: UpdateResourceScheduleDto, currentUser: User, businessIdValue?: unknown): Promise<import("./entities/resource-schedule.entity").ResourceSchedule>;
    remove(id: number): Promise<boolean>;
    removeForBusiness(id: number, currentUser: User, businessIdValue?: unknown): Promise<{
        deleted: boolean;
    }>;
    private resolveResourceAccess;
    private requireBusinessUserBusinessId;
    private assertResourceBelongsToBusiness;
    private parsePositiveInteger;
}
