import { User } from '../users/entities/user.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceAccessFilter, ServicesRepository } from './services.repository';
export declare class ServicesService {
    private readonly servicesRepository;
    constructor(servicesRepository: ServicesRepository);
    create(createServiceDto: CreateServiceDto): Promise<import("./entities/service.entity").Service>;
    createForBusiness(createServiceDto: CreateServiceDto, currentUser: User, businessIdValue?: unknown): Promise<import("./entities/service.entity").Service>;
    findAll(): Promise<import("./entities/service.entity").Service[]>;
    findAllForBusiness(currentUser: User, businessIdValue?: unknown): Promise<import("./entities/service.entity").Service[]>;
    findOne(id: number): Promise<import("./entities/service.entity").Service | null>;
    findOneForBusiness(id: number, currentUser: User, businessIdValue?: unknown): Promise<import("./entities/service.entity").Service>;
    update(id: number, updateServiceDto: UpdateServiceDto, businessId?: number, accessFilter?: ServiceAccessFilter): Promise<import("./entities/service.entity").Service | null>;
    updateForBusiness(id: number, updateServiceDto: UpdateServiceDto, currentUser: User, businessIdValue?: unknown): Promise<import("./entities/service.entity").Service>;
    remove(id: number): Promise<boolean>;
    private resolveServiceAccess;
    private resolveAccessScope;
    private requireBusinessUserBusinessId;
    private assertBranchBelongsToBusiness;
    private validateResourceSelectionMode;
    private parsePositiveInteger;
    private normalizeOptionalString;
}
