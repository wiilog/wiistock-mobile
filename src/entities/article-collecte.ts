export interface ArticleCollecte {
    id: number|null;
    label: string;
    reference: string;
    quantite: number;
    is_ref: number;
    id_collecte: number;
    has_moved: number;
    emplacement: string;
    barcode?: string;
    reference_label?: string;
    quantity_type?: 'article'|'reference';
}
