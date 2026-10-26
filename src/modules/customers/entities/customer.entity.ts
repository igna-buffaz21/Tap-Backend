export const CUSTOMER_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export class Customer {
  id!: number;
  business_id!: number;
  status!: CustomerStatus;
  name!: string;
  phone!: string;
  email!: string;
  created_at!: Date;
  updated_at!: Date;
}
