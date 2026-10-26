export const BRANCH_TYPES = [
  'PADEL',
  'SOCCER',
  'BARBERSHOP',
  'HAIR_SALON',
] as const;

export type BranchType = (typeof BRANCH_TYPES)[number];

export type BranchOpeningHoursDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface BranchOpeningHoursRange {
  open: string;
  /** A value earlier than `open` represents a closing time on the next day. */
  close: string;
}

export type BranchOpeningHours = Record<
  BranchOpeningHoursDay,
  BranchOpeningHoursRange[]
>;

export class Branch {
  id!: number;
  business_id!: number;
  name!: string;
  slug!: string;
  branch_type!: BranchType | null;
  description!: string | null;
  logo_url!: string | null;
  cover_image_url!: string | null;
  primary_color!: string | null;
  instagram_url!: string | null;
  facebook_url!: string | null;
  address!: string | null;
  phone!: string | null;
  lat!: number | null;
  lng!: number | null;
  opening_hours!: BranchOpeningHours | null;
  status!: string;
  created_at!: Date;
  updated_at!: Date;
}
