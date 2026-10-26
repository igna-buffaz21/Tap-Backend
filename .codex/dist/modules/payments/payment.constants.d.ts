export declare const PAYMENT_METHODS: readonly ["CASH", "TRANSFER", "CARD", "MERCADO_PAGO", "OTHER"];
export declare const PAYMENT_STATUSES: readonly ["PENDING", "PAID", "CANCELLED", "REFUNDED"];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
