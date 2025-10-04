export interface SaisieInventaire {
    id: number|null;
    mission_id: number;
    date: string;
    barcode?: string;
    is_ref: number;
    quantity: number;
    location: string;
}
