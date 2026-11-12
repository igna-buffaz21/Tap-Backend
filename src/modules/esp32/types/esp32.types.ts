export type AntennaPowers = [number, number, number, number];

export interface TagReading {
  epc: string;
  antenna: number;
  rssiRaw: number;
}

export interface TagRecord extends TagReading {
  count: number;
  firstSeen: Date;
  lastSeen: Date;
}

export interface TemperatureReading {
  date: Date;
  celsius: number;
  inventoryActive: boolean;
  antenna: number;
  powerDbm: number | null;
}

export interface InventoryOptions {
  antenna?: number;
  pauseMs?: number;
}

export interface EpcWriteOptions {
  currentEpc: string;
  newEpc: string;
  antenna: number;
  password?: string;
}

export interface SingleTagReadResult {
  found: boolean;
  tag: TagReading | null;
}

export interface RfidFlowResult {
  epcs: string[];
  total: number;
  door: 'open';
}

export interface RfidProductFlowResult {
  products: Array<{ epc: string; product: Product | null }>;
  total: number;
  door: RfidFlowResult['door'];
}

export type RfidFlowProgress =
  | { stage: 'opening' | 'holding' | 'closing' | 'reading' }
  | { stage: 'reopening'; epcs: string[] };
import type { Product } from '../../products/entities/product.entity';
