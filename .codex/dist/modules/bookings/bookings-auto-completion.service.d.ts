import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookingsEventsService } from './bookings-events.service';
import { BookingsRepository } from './bookings.repository';
export declare class BookingsAutoCompletionService implements OnModuleInit, OnModuleDestroy {
    private readonly bookingsRepository;
    private readonly bookingsEventsService;
    private readonly configService;
    private readonly logger;
    private readonly enabled;
    private readonly intervalMs;
    private readonly toleranceMs;
    private timer;
    private isRunning;
    constructor(bookingsRepository: BookingsRepository, bookingsEventsService: BookingsEventsService, configService: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private completeDueBookings;
    private getBooleanConfig;
    private getPositiveIntegerConfig;
}
