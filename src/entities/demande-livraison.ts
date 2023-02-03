export interface DemandeLivraison {
    id: number;
    user_id: number;
    type_id: number;
    location_id: number;
    comment?: string;
    last_error?: string;
    free_fields: string;
}
