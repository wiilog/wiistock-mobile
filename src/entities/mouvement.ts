export interface Mouvement {
    id: number|null;
    reference: string;
    barcode?: string;
    quantity: number;
    date_pickup: string;
    location_from: string;
    date_drop: string|null;
    location: string|null;
    type: string;
    is_ref: number;
    id_article_prepa?: number|null;
    id_prepa: number|null;
    id_article_livraison: number|null;
    id_livraison: number|null;
    selected_by_article?: number;
    id_article_collecte?: number|null;
    id_collecte: number|null;
}
