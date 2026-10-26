import { Observable } from 'rxjs';
export type BookingChangeType = 'created' | 'updated' | 'deleted' | 'reconfirmed' | 'cancelled';
export interface BookingChangeEvent {
    type: BookingChangeType;
    businessId: number;
    bookingId?: number;
    occurredAt: string;
}
export declare class BookingsEventsService {
    private readonly changesSubject;
    emitChange(event: Omit<BookingChangeEvent, 'occurredAt'> & {
        occurredAt?: string;
    }): void;
    watchBusiness(businessId: number): Observable<BookingChangeEvent>;
}
