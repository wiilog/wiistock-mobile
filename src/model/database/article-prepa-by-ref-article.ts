export interface ArticlePrepaByRefArticle {
    id: number;
    reference: string;
    label: string;
    location: string;
    quantity: number;
    reference_article: string;
    isSelectableByUser: number;
    pickingPriority: number;
    barcode?: string;
    management_date?: string;
    management_order?: number;
    management?: string;
}
