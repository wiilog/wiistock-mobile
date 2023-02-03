export interface TableDefinition {
    name: TableName;
    keepOnConnection?: boolean;
    /** attributeName => constraint */
    attributes: {
        [attributeName: string]: string
    }
}

export type TableName = 'emplacement'
                      | 'mouvement'
                      | 'mouvement_traca'
                      | 'preparation'
                      | 'article_prepa'
                      | 'article_prepa_by_ref_article'
                      | 'livraison'
                      | 'collecte'
                      | 'article_livraison'
                      | 'article_inventaire'
                      | 'article_collecte'
                      | 'saisie_inventaire'
                      | 'anomalie_inventaire'
                      | 'handling'
                      | 'handling_attachment'
                      | 'demande_livraison'
                      | 'article_in_demande_livraison'
                      | 'demande_livraison_type'
                      | 'demande_livraison_article'
                      | 'free_field'
                      | 'nature'
                      | 'allowed_nature_location'
                      | 'translations'
                      | 'dispatch'
                      | 'dispatch_pack'
                      | 'status'
                      | 'transfer_order'
                      | 'transfer_order_article'
                      | 'empty_round'
                      | 'picking_article_collecte'
                      | 'transport_round'
                      | 'transport_round_line'
                      | 'dispatch_type'
                      | 'user'
                      | 'reference'
                      | 'project';
