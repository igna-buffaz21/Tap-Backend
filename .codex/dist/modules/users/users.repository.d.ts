import { DatabaseService } from '../../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
export interface InviteUserRecord {
    businessId: number;
    email: string;
    name: string;
    roleIds: number[];
    branchIds: number[];
}
export interface ActivatePendingUserRecord {
    clerkId: string;
    email: string;
    name: string;
    photoUrl: string | null;
}
export interface AvailableRoleRow {
    id: number;
    business_id: number | null;
    name: string;
    status: string;
}
export declare class UsersRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    create(createUserDto: CreateUserDto): Promise<User>;
    findAll(): Promise<User[]>;
    findAllForBusiness(businessId: number, branchId?: number, allowedBranchIds?: number[]): Promise<User[]>;
    findAllByBranch(branchId: number): Promise<User[]>;
    findAllByBranchForBusiness(branchId: number, businessId: number): Promise<User[]>;
    findById(id: number): Promise<User | null>;
    findByIdForBusiness(id: number, businessId: number, allowedBranchIds?: number[]): Promise<User | null>;
    findByClerkId(clerkId: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    createPendingInvitation(record: InviteUserRecord): Promise<User>;
    activatePendingUserFromClerk(record: ActivatePendingUserRecord): Promise<User | null>;
    removePendingInvitation(userId: number, businessId: number): Promise<boolean>;
    findAvailableActiveRolesByIds(roleIds: number[], businessId: number): Promise<AvailableRoleRow[]>;
    findBranchIdsForBusiness(branchIds: number[], businessId: number): Promise<number[]>;
    branchBelongsToBusiness(branchId: number, businessId: number): Promise<boolean>;
    updateForBusiness(id: number, businessId: number, updateUserDto: UpdateUserDto, allowedBranchIds?: number[]): Promise<User | null>;
    removeForBusiness(id: number, businessId: number, allowedBranchIds?: number[]): Promise<boolean>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<User | null>;
    remove(id: number): Promise<boolean>;
    private buildUserBranchAccessCondition;
    private buildUserRolesJoin;
}
