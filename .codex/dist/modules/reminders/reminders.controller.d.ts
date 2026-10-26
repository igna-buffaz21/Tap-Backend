import { User } from '../users/entities/user.entity';
import { RemindersService } from './reminders.service';
import { UpdateReminderDto } from './dto/update-reminder.dto';
export declare class RemindersController {
    private readonly remindersService;
    constructor(remindersService: RemindersService);
    findAll(currentUser: User, businessId?: string): Promise<import("./entities/reminder.entity").Reminder[]>;
    findOne(id: string, currentUser: User, businessId?: string): Promise<import("./entities/reminder.entity").Reminder>;
    update(id: string, updateReminderDto: UpdateReminderDto, currentUser: User, businessId?: string): Promise<import("./entities/reminder.entity").Reminder>;
    remove(id: string, currentUser: User, businessId?: string): Promise<{
        deleted: boolean;
    }>;
}
