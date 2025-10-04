export interface ArticleInventaire {
    id: number;
    mission_id: number;
    mission_start: string;
    mission_end: string;
    mission_name: string;
    reference: string;
    is_ref: number;
    location: string;
    barcode?: string;
    type?: string;
    done?: boolean;
    logistic_unit_code?: string;
    logistic_unit_id?: number;
    logistic_unit_nature?: string;
}
