import { User } from '../users/entities/user.entity';
import { ResourceSchedulesService } from './resource-schedules.service';
import { CreateResourceScheduleDto } from './dto/create-resource-schedule.dto';
import { UpdateResourceScheduleDto } from './dto/update-resource-schedule.dto';
export declare class ResourceSchedulesController {
    private readonly resourceSchedulesService;
    constructor(resourceSchedulesService: ResourceSchedulesService);
    create(createResourceScheduleDto: CreateResourceScheduleDto, currentUser: User, businessId?: string): Promise<import("./entities/resource-schedule.entity").ResourceSchedule>;
    findAll(currentUser: User, businessId?: string): Promise<import("./entities/resource-schedule.entity").ResourceSchedule[]>;
    findOne(id: string, currentUser: User, businessId?: string): Promise<import("./entities/resource-schedule.entity").ResourceSchedule>;
    update(id: string, updateResourceScheduleDto: UpdateResourceScheduleDto, currentUser: User, businessId?: string): Promise<import("./entities/resource-schedule.entity").ResourceSchedule>;
    remove(id: string, currentUser: User, businessId?: string): Promise<{
        deleted: boolean;
    }>;
}
