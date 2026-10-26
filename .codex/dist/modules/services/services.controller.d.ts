import { User } from '../users/entities/user.entity';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
export declare class ServicesController {
    private readonly servicesService;
    constructor(servicesService: ServicesService);
    create(createServiceDto: CreateServiceDto, currentUser: User, businessId?: string): Promise<import("./entities/service.entity").Service>;
    findAll(currentUser: User, businessId?: string): Promise<import("./entities/service.entity").Service[]>;
    findOne(id: string, currentUser: User, businessId?: string): Promise<import("./entities/service.entity").Service>;
    update(id: string, updateServiceDto: UpdateServiceDto, currentUser: User, businessId?: string): Promise<import("./entities/service.entity").Service>;
}
