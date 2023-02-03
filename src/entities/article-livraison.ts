export interface ArticleLivraison {
    id: number;
    label: string;
    reference: string;
    quantity: number;
    is_ref: number;
    id_livraison: number;
    has_moved?: number;
    location: string;
    barcode?: string;
    targetLocationPicking?: string;
    currentLogisticUnitId?: number;
    currentLogisticUnitCode?: string;
    currentLogisticUnitNatureId?: string;
    currentLogisticUnitLocation?: string;
}
