export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export type StockMovementReason =
  | 'PURCHASE'
  | 'SALE'
  | 'SALE_CANCELLATION'
  | 'INTERNAL_USE'
  | 'LOSS'
  | 'DAMAGE'
  | 'RETURN'
  | 'MANUAL_ADJUSTMENT'
  | 'OTHER';

export class StockMovement {
  id!: number;
  business_id!: number;
  branch_id!: number;
  product_id!: number;
  type!: StockMovementType;
  quantity!: number;
  unit_cost!: number | null;
  previous_quantity!: number;
  new_quantity!: number;
  reason!: StockMovementReason | null;
  notes!: string | null;
  created_by_user_id!: number | null;
  created_by_user_name!: string | null;
  created_at!: Date;
}
