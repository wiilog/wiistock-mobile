export interface DemandeLivraisonArticle {
    id: number;
    label: string;
    reference: string;
    bar_code: string;
    type_quantity: string;
    location_label: string;
    available_quantity: number;
    quantity_to_pick: number;
}
