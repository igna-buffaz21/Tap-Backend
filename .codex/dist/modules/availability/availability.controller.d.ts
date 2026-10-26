import { User } from '../users/entities/user.entity';
import { AvailabilityService } from './availability.service';
import { GetDayBoundsDto } from './dto/get-day-bounds.dto';
import { GetAvailabilityDto } from './dto/get-availability.dto';
export declare class AvailabilityController {
    private readonly availabilityService;
    constructor(availabilityService: AvailabilityService);
    findAvailability(query: GetAvailabilityDto, currentUser: User): Promise<import("../bookings/booking-rules.service").AvailabilityResponse>;
    findDayBounds(query: GetDayBoundsDto, currentUser: User): Promise<import("../bookings/booking-rules.service").DayBoundsResponse>;
}
