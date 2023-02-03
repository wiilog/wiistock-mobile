export interface ArticlePrepa {
    id?: number;
    label: string;
    reference: string;
    type_quantite?: string;
    quantite: number;
    is_ref: number;
    id_prepa: number;
    has_moved: number;
    emplacement: string;
    barcode?: string;
    reference_article_reference: string;
    // ArticlePrepaByRefArticle
    isSelectableByUser?: number;
    reference_article?: string;
    targetLocationPicking?: string;
    lineLogisticUnitId?: number;
    lineLogisticUnitCode?: string;
    lineLogisticUnitNatureId?: string;
    lineLogisticUnitLocation?: string;
}
