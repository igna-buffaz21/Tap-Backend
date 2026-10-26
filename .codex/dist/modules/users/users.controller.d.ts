import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<{
        clerk_id: string | null;
        business_id: number | null;
        branch_id: number | null;
        name: string;
        email: string;
        photo_url: string | null;
        status: string;
        id: number;
        roles?: import("./entities/user.entity").UserRoleSummary[] | undefined;
        created_at: Date;
        updated_at: Date;
    }>;
    invite(inviteUserDto: InviteUserDto, currentUser: User): Promise<{
        user: {
            clerk_id: string | null;
            business_id: number | null;
            branch_id: number | null;
            name: string;
            email: string;
            photo_url: string | null;
            status: string;
            id: number;
            roles?: import("./entities/user.entity").UserRoleSummary[] | undefined;
            created_at: Date;
            updated_at: Date;
        };
        invitation: {
            id: string;
            emailAddress: string;
            status: string;
            url: string | undefined;
        };
    }>;
    findAll(currentUser: User, branchId?: string): Promise<{
        clerk_id: string | null;
        business_id: number | null;
        branch_id: number | null;
        name: string;
        email: string;
        photo_url: string | null;
        status: string;
        id: number;
        roles?: import("./entities/user.entity").UserRoleSummary[] | undefined;
        created_at: Date;
        updated_at: Date;
    }[]>;
    findOne(id: string, currentUser: User): Promise<{
        clerk_id: string | null;
        business_id: number | null;
        branch_id: number | null;
        name: string;
        email: string;
        photo_url: string | null;
        status: string;
        id: number;
        roles?: import("./entities/user.entity").UserRoleSummary[] | undefined;
        created_at: Date;
        updated_at: Date;
    } | null>;
    update(id: string, updateUserDto: UpdateUserDto, currentUser: User): Promise<{
        clerk_id: string | null;
        business_id: number | null;
        branch_id: number | null;
        name: string;
        email: string;
        photo_url: string | null;
        status: string;
        id: number;
        roles?: import("./entities/user.entity").UserRoleSummary[] | undefined;
        created_at: Date;
        updated_at: Date;
    } | null>;
    remove(id: string, currentUser: User): Promise<boolean>;
}
