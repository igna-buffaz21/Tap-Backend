import { ResourceSelectionMode } from '../../bookings/resource-selection.types';
export declare class UpdateServiceDto {
    branch_id?: number;
    name?: string;
    description?: string;
    duration_minutes?: number;
    price?: number;
    icon_key?: string | null;
    image_url?: string | null;
    status?: string;
    resource_selection_mode?: ResourceSelectionMode;
}
