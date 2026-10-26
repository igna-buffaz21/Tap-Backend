export interface LocalDateParts {
    year: number;
    month: number;
    day: number;
}
export interface LocalTimeParts {
    hour: number;
    minute: number;
    second: number;
}
export declare function isValidTimeZone(timeZone: string): boolean;
export declare function parseDateOnly(value: string): LocalDateParts | null;
export declare function parseTime(value: string): LocalTimeParts | null;
export declare function getDayOfWeek(date: LocalDateParts): number;
export declare function addDays(date: LocalDateParts, amount: number): LocalDateParts;
export declare function zonedDateTimeToUtc(date: LocalDateParts, time: LocalTimeParts, timeZone: string): Date;
export declare function localDateRangeToUtc(date: LocalDateParts, timeZone: string): {
    start: Date;
    end: Date;
};
export declare function formatInTimeZone(date: Date, timeZone: string): string;
export declare function getLocalDateFromInstant(date: Date, timeZone: string): LocalDateParts;
