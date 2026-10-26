export declare class CreateProductDto {
    category_id?: number | null;
    name: string;
    description?: string | null;
    sku?: string | null;
    unit?: string;
    cost_price?: number | null;
    sale_price?: number | null;
    branch_id?: number;
    minimum_quantity?: number;
    status?: string;
}
