import type { IaWhatsappMessageInterpretation } from '../ia-service/ia-service.types';
export interface BookingSummaryData {
    customerName?: string;
    date?: string;
    time?: string;
    serviceName?: string;
    resourceName?: string;
    branchName?: string;
    businessType?: string;
}
export interface AvailabilitySlot {
    startsAt: string;
    label?: string;
}
export interface CustomerBookingSummaryData {
    date: string;
    time: string;
    serviceName: string;
    resourceName?: string;
    branchName?: string;
}
export declare const whatsappResponseTemplates: {
    greeting: () => string;
    askName: () => string;
    askDate: () => string;
    askTime: () => string;
    askDateAndTime: () => string;
    askService: () => string;
    serviceListBody: () => string;
    serviceListButton: () => string;
    serviceListSectionTitle: () => string;
    serviceResourceListBody: () => string;
    serviceResourceListButton: () => string;
    serviceResourceListSectionTitle: () => string;
    resourceListBody: (serviceName: string) => string;
    resourceListButton: () => string;
    resourceListSectionTitle: () => string;
    noResourcesForService: () => string;
    customerConfirmation: (name: string) => string;
    bookingSummary: (data: BookingSummaryData) => string;
    bookingConfirmed: () => string;
    bookingRejected: () => string;
    error: () => string;
    noAvailability: () => string;
    requestedTimeAvailableAskName: (time: string) => string;
    requestedTimeUnavailable: (requestedTime: string, slots: AvailabilitySlot[]) => string;
    requestedTimeUnavailableListBody: (requestedTime: string) => string;
    cancellationConfirmed: () => string;
    customerBookingsEmpty: () => string;
    customerBookingsIntro: () => string;
    cancelBookingSelectionBody: () => string;
    cancelBookingNotMatched: () => string;
    bookingCancellationConfirmed: (data: CustomerBookingSummaryData) => string;
    bookingCancellationConfirmationQuestion: (data: CustomerBookingSummaryData) => string;
    bookingCancellationKept: () => string;
    humanRequired: () => string;
    clarification: () => string;
    availabilityListBody: () => string;
    availabilityListButton: () => string;
    availabilityListSectionTitle: () => string;
    availabilityMessage: (slots: AvailabilitySlot[]) => string;
};
export declare function buildDeterministicWhatsappReply(interpretation: IaWhatsappMessageInterpretation): string | null;
