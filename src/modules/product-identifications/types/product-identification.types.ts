export const PRODUCT_IDENTIFICATION_TYPES = [
  'RFID_UHF',
  'EAN_13',
  'QR',
] as const;

export type ProductIdentificationType =
  (typeof PRODUCT_IDENTIFICATION_TYPES)[number];

export interface ProductIdentification {
  id: string;
  business_id: string;
  product_id: string;
  type: ProductIdentificationType;
  value: string;
  created_at: Date;
}
import type { Product } from '../../products/entities/product.entity';

export interface IdentifiedProduct extends Product {
  identification_value: string;
}
