import { SaleItem } from '../../sale-items/entities/sale-item.entity';

export class Sale {
  id!: number;
  business_id!: number;
  branch_id!: number;
  customer_id!: number | null;
  status!: string;
  subtotal!: number;
  discount_amount!: number;
  total_amount!: number;
  notes!: string | null;
  created_by!: number;
  created_at!: Date;
  updated_at!: Date;
  items!: SaleItem[];
}
