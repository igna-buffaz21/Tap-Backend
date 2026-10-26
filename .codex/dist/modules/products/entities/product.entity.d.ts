export declare class Product {
    id: number;
    business_id: number;
    category_id: number | null;
    name: string;
    description: string | null;
    sku: string | null;
    unit: string;
    cost_price: number | null;
    sale_price: number | null;
    status: string;
    created_at: Date;
    updated_at: Date;
}
