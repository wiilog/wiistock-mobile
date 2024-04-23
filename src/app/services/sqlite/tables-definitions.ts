import {TableDefinition, TableName} from '@app/services/sqlite/table-definition';

export const keptTablesOnConnection: Array<TableName> = [
    'demande_livraison',
    'article_in_demande_livraison',
    'demande_livraison_type',
    'demande_livraison_article',
    'dispatch_type',
    'type',
]

export const TablesDefinitions: Array<TableDefinition> = [
    {
        name: 'emplacement',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'label', value: 'VARCHAR(255)'},
            {column: 'temperature_ranges', value: 'VARCHAR(255)'},
            {column: 'signatories', value: 'VARCHAR(255)'},
        ]
    },
    {
        name: 'mouvement',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            {column: 'reference', value: 'INTEGER'},
            {column: 'quantity', value: 'INTEGER'},
            {column: 'barcode', value: 'VARCHAR(255)'},
            {column: 'date_pickup', value: 'VARCHAR(255)'},
            {column: 'location_from', value: 'TEXT'},
            {column: 'date_drop', value: 'VARCHAR(255)'},
            {column: 'location', value: 'TEXT'},
            {column: 'type', value: 'VARCHAR(255)'},
            {column: 'is_ref', value: 'INTEGER'},
            {column: 'id_article_prepa', value: 'INTEGER'},
            {column: 'id_prepa', value: 'INTEGER'},
            {column: 'id_article_livraison', value: 'INTEGER'},
            {column: 'id_livraison', value: 'INTEGER'},
            {column: 'id_article_collecte', value: 'INTEGER'},
            {column: 'id_collecte', value: 'INTEGER'},
            {column: 'selected_by_article', value: 'INTEGER'},
        ]
    },
    {
        name: 'mouvement_traca',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            {column: 'ref_article', value: 'VARCHAR(255)'},
            {column: 'date', value: 'VARCHAR(255)'},
            {column: 'ref_emplacement', value: 'VARCHAR(255)'},
            {column: 'type', value: 'VARCHAR(255)'},
            {column: 'operateur', value: 'VARCHAR(255)'},
            {column: 'comment', value: 'VARCHAR(255)'},
            {column: 'signature', value: 'TEXT'},
            {column: 'freeFields', value: 'TEXT'},
            {column: 'photo', value: 'TEXT'},
            {column: 'finished', value: 'INTEGER'},
            {column: 'fromStock', value: 'INTEGER'},
            {column: 'quantity', value: 'INTEGER'},
            {column: 'nature_id', value: 'INTEGER'},
            {column: 'isGroup', value: 'INTEGER'},
            {column: 'subPacks', value: 'TEXT'},
            {column: 'packParent', value: 'VARCHAR(255)'},
            {column: 'articles', value: 'JSON'},
            {column: 'containsArticle', value: 'INTEGER'},
            {column: 'projectId', value: 'INTEGER'},
        ]
    },
    {
        name: 'preparation',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'numero', value: 'TEXT'},
            {column: 'emplacement', value: 'TEXT'},
            {column: 'date_end', value: 'TEXT'},
            {column: 'destination', value: 'TEXT'},
            {column: 'started', value: 'INTEGER'},
            {column: 'requester', value: 'VARCHAR(255)'},
            {column: 'type', value: 'VARCHAR(255)'},
            {column: 'comment', value: 'TEXT'},
            {column: 'expectedAt', value: 'TEXT'},
            {column: 'color', value: 'VARCHAR(255)'},
            {column: 'project', value: 'VARCHAR(255)'}
        ]
    },
    {
        name: 'article_prepa',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            {column: 'label', value: 'TEXT'},
            {column: 'reference', value: 'TEXT'},
            {column: 'emplacement', value: 'TEXT'},
            {column: 'type_quantite', value: 'TEXT'},
            {column: 'barcode', value: 'TEXT'},
            {column: 'reference_article_reference', value: 'TEXT'},
            {column: 'quantite', value: 'INTEGER'},
            {column: 'is_ref', value: 'INTEGER'},
            {column: 'id_prepa', value: 'INTEGER'},
            {column: 'has_moved', value: 'INTEGER'},
            {column: 'isSelectableByUser', value: 'INTEGER'},
            {column: 'original_quantity', value: 'INTEGER'},
            {column: 'deleted', value: 'INTEGER DEFAULT 0'},
            {column: 'targetLocationPicking', value: 'TEXT'},
            {column: 'lineLogisticUnitId', value: 'INTEGER'},
            {column: 'lineLogisticUnitCode', value: 'TEXT'},
            {column: 'lineLogisticUnitNatureId', value: 'INTEGER'},
            {column: 'lineLogisticUnitLocation', value: 'TEXT'},
        ]
    },
    {
        name: 'article_prepa_by_ref_article',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            {column: 'reference', value: 'TEXT'},
            {column: 'label', value: 'TEXT'},
            {column: 'location', value: 'TEXT'},
            {column: 'reference_article', value: 'TEXT'},
            {column: 'reference_barCode', value: 'VARCHAR(255)'},
            {column: 'barcode', value: 'TEXT'},
            {column: 'quantity', value: 'INTEGER'},
            {column: 'isSelectableByUser', value: 'INTEGER'},
            {column: 'management', value: 'VARCHAR(255)'},
            {column: 'management_date', value: 'VARCHAR(255)'},
            {column: 'management_order', value: 'INTEGER'},
            {column: 'pickingPriority', value: 'INTEGER'},
        ]
    },
    {
        name: 'livraison',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'number', value: 'TEXT'},
            {column: 'location', value: 'TEXT'},
            {column: 'date_end', value: 'TEXT'},
            {column: 'requester', value: 'VARCHAR(255)'},
            {column: 'type', value: 'VARCHAR(255)'},
            {column: 'preparationLocation', value: 'VARCHAR(255)'},
            {column: 'comment', value: 'TEXT'},
            {column: 'expectedAt', value: 'TEXT'},
            {column: 'color', value: 'VARCHAR(255)'},
            {column: 'project', value: 'VARCHAR(255)'}
        ]
    },
    {
        name: 'collecte',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'number', value: 'TEXT'},
            {column: 'date_end', value: 'TEXT'},
            {column: 'location_from', value: 'VARCHAR(255)'},
            {column: 'location_to', value: 'VARCHAR(255)'},
            {column: 'requester', value: 'VARCHAR(255)'},
            {column: 'type', value: 'VARCHAR(255)'},
            {column: 'forStock', value: 'INTEGER'},
            {column: 'comment', value: 'VARCHAR(255)'}
        ]
    },
    {
        name: 'transfer_order',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'number', value: 'TEXT'},
            {column: 'requester', value: 'VARCHAR(255)'},
            {column: 'destination', value: 'VARCHAR(255)'},
            {column: 'origin', value: 'VARCHAR(255)'},
            {column: 'treated', value: 'INTEGER'}
        ]
    },
    {
        name: 'transfer_order_article',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            {column: 'barcode', value: 'VARCHAR(255)'},
            {column: 'label', value: 'VARCHAR(255)'},
            {column: 'reference', value: 'VARCHAR(255)'},
            {column: 'location', value: 'VARCHAR(255)'},
            {column: 'quantity', value: 'INTEGER'},
            {column: 'transfer_order_id', value: 'INTEGER'}
        ]
    },
    {
        name: 'article_livraison',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            {column: 'label', value: 'TEXT'},
            {column: 'reference', value: 'TEXT'},
            {column: 'location', value: 'TEXT'},
            {column: 'barcode', value: 'TEXT'},
            {column: 'quantity', value: 'INTEGER'},
            {column: 'is_ref', value: 'INTEGER'},
            {column: 'id_livraison', value: 'INTEGER'},
            {column: 'has_moved', value: 'INTEGER'},
            {column: 'targetLocationPicking', value: 'TEXT'},
            {column: 'currentLogisticUnitId', value: 'INTEGER'},
            {column: 'currentLogisticUnitCode', value: 'TEXT'},
            {column: 'currentLogisticUnitNatureId', value: 'TEXT'},
            {column: 'currentLogisticUnitLocation', value: 'TEXT'},
        ]
    },
    {
        name: 'inventory_item',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'reference', value: 'TEXT'},
            {column: 'location', value: 'TEXT'},
            {column: 'barcode', value: 'TEXT'},
            {column: 'mission_id', value: 'INTEGER'},
            {column: 'mission_start', value: 'VARCHAR(255)'},
            {column: 'mission_end', value: 'VARCHAR(255)'},
            {column: 'mission_name', value: 'VARCHAR(255)'},
            {column: 'is_ref', value: 'INTEGER'},
            {column: 'type', value: 'VARCHAR(255)'},
            {column: 'done', value: 'INTEGER'},
            {column: 'logistic_unit_code', value: 'VARCHAR(255)'},
            {column: 'logistic_unit_nature', value: 'VARCHAR(255)'},
            {column: 'logistic_unit_id', value: 'INTEGER'},
        ]
    },
    {
        name: 'article_collecte',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            {column: 'label', value: 'TEXT'},
            {column: 'reference', value: 'TEXT'},
            {column: 'emplacement', value: 'TEXT'},
            {column: 'barcode', value: 'TEXT'},
            {column: 'quantite', value: 'INTEGER'},
            {column: 'is_ref', value: 'INTEGER'},
            {column: 'id_collecte', value: 'INTEGER'},
            {column: 'has_moved', value: 'INTEGER'},
            {column: 'reference_label', value: 'VARCHAR(255)'},
            {column: 'quantity_type', value: 'VARCHAR(255)'}
        ]
    },
    {
        name: 'picking_article_collecte',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            {column: 'label', value: 'TEXT'},
            {column: 'reference', value: 'TEXT'},
            {column: 'reference_label', value: 'TEXT'},
            {column: 'barcode', value: 'TEXT'},
            {column: 'location', value: 'TEXT'},
            {column: 'is_ref', value: 'INTEGER'}
        ]
    },
    {
        name: 'saisie_inventaire',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            {column: 'bar_code', value: 'VARCHAR(255)'},
            {column: 'date', value: 'TEXT'},
            {column: 'location', value: 'TEXT'},
            {column: 'mission_id', value: 'INTEGER'},
            {column: 'is_ref', value: 'INTEGER'},
            {column: 'quantity', value: 'INTEGER'}
        ]
    },
    {
        name: 'anomalie_inventaire',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            {column: 'reference', value: 'TEXT'},
            {column: 'location', value: 'TEXT'},
            {column: 'comment', value: 'TEXT'},
            {column: 'barcode', value: 'TEXT'},
            {column: 'treated', value: 'TEXT'},
            {column: 'type', value: 'VARCHAR(255)'},
            {column: 'done', value: 'INTEGER'},
            {column: 'is_ref', value: 'INTEGER'},
            {column: 'quantity', value: 'INTEGER'},
            {column: 'is_treatable', value: 'INTEGER'},
            {column: 'countedQuantity', value: 'INTEGER'},
            {column: 'mission_id', value: 'INTEGER'},
            {column: 'mission_start', value: 'VARCHAR(255)'},
            {column: 'mission_end', value: 'VARCHAR(255)'},
            {column: 'mission_name', value: 'VARCHAR(255)'},
        ]
    },
    {
        name: 'handling',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'number', value: 'VARCHAR(255)'},
            {column: 'typeId', value: 'INTEGER'},
            {column: 'statusId', value: 'INTEGER'},
            {column: 'carriedOutOperationCount', value: 'INTEGER'},
            {column: 'typeLabel', value: 'VARCHAR(255)'},
            {column: 'requester', value: 'VARCHAR(255)'},
            {column: 'desiredDate', value: 'VARCHAR(255)'},
            {column: 'comment', value: 'TEXT'},
            {column: 'destination', value: 'TEXT'},
            {column: 'source', value: 'TEXT'},
            {column: 'subject', value: 'VARCHAR(255)'},
            {column: 'emergency', value: 'VARCHAR(255)'},
            {column: 'freeFields', value: 'TEXT'},
            {column: 'color', value: 'VARCHAR(255)'}
        ]
    },
    {
        name: 'handling_attachment',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            {column: 'fileName', value: 'VARCHAR(255)'},
            {column: 'href', value: 'VARCHAR(255)'},
            {column: 'handlingId', value: 'INTEGER'}
        ]
    },
    {
        name: 'demande_livraison',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            {column: 'location_id', value: 'integer'},
            {column: 'comment', value: 'VARCHAR(255)'},
            {column: 'type_id', value: 'integer'},
            {column: 'user_id', value: 'integer'},
            {column: 'last_error', value: 'VARCHAR(255)'},
            {column: 'free_fields', value: 'TEXT'},
        ]
    },
    {
        name: 'article_in_demande_livraison',
        schema: [
            {column: 'demande_id', value: 'INTEGER'},
            {column: 'article_bar_code', value: 'VARCHAR(255)'},
            {column: 'quantity_to_pick', value: 'INTEGER'}
        ]
    },
    {
        name: 'demande_livraison_type',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'label', value: 'VARCHAR(255)'},
            {column: 'to_delete', value: 'INTEGER'}
        ]
    },
    {
        name: 'demande_livraison_article',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'label', value: 'VARCHAR(255)'},
            {column: 'reference', value: 'VARCHAR(255)'},
            {column: 'bar_code', value: 'VARCHAR(255)'},
            {column: 'type_quantity', value: 'VARCHAR(255)'},
            {column: 'location_label', value: 'VARCHAR(255)'},
            {column: 'available_quantity', value: 'INTEGER'},
            {column: 'to_delete', value: 'INTEGER'}
        ]
    },
    {
        name: 'free_field',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'label', value: 'VARCHAR(255)'},
            {column: 'typeId', value: 'INTEGER'},
            {column: 'categoryType', value: 'VARCHAR(255)'},
            {column: 'typing', value: 'VARCHAR(255)'},
            {column: 'requiredCreate', value: 'INTEGER'},
            {column: 'requiredEdit', value: 'INTEGER'},
            {column: 'elements', value: 'TEXT'},
            {column: 'defaultValue', value: 'TEXT'}
        ]
    },
    {
        name: 'nature',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'label', value: 'VARCHAR(255)'},
            {column: 'color', value: 'VARCHAR(255)'},
            {column: 'hide', value: 'INTEGER'},
            {column: 'defaultNature', value: 'INTEGER'},
            {column: 'isDisplayedOnDispatch', value: 'INTEGER'},
        ]
    },
    {
        name: 'allowed_nature_location',
        schema: [
            {column: 'location_id', value: 'INTEGER'},
            {column: 'nature_id', value: 'INTEGER'}
        ]
    },
    {
        name: 'translations',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'topMenu', value: 'VARCHAR(255)'},
            {column: 'subMenu', value: 'VARCHAR(255)'},
            {column: 'menu', value: 'VARCHAR(255)'},
            {column: 'label', value: 'VARCHAR(255)'},
            {column: 'translation', value: 'VARCHAR(255)'}
        ]
    },
    {
        name: 'dispatch',
        schema: [
            {column: 'localId', value: 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            {column: 'id', value: 'INTEGER'},
            {column: 'requester', value: 'VARCHAR(255)'},
            {column: 'number', value: 'VARCHAR(255)'},
            {column: 'statusId', value: 'INTEGER'},
            {column: 'startDate', value: 'VARCHAR(255)'},
            {column: 'createdAt', value: 'VARCHAR(255)'},
            {column: 'endDate', value: 'VARCHAR(255)'},
            {column: 'carrierTrackingNumber', value: 'VARCHAR(255)'},
            {column: 'emergency', value: 'VARCHAR(255)'},
            {column: 'locationFromLabel', value: 'VARCHAR(255)'},
            {column: 'locationFromId', value: 'INTEGER'},
            {column: 'locationToLabel', value: 'VARCHAR(255)'},
            {column: 'locationToId', value: 'INTEGER'},
            {column: 'typeId', value: 'INTEGER'},
            {column: 'typeLabel', value: 'VARCHAR(255)'},
            {column: 'statusLabel', value: 'VARCHAR(255)'},
            {column: 'treatedStatusId', value: 'INTEGER'},
            {column: 'partial', value: 'INTEGER'},
            {column: 'color', value: 'VARCHAR(255)'},
            {column: 'destination', value: 'VARCHAR(255)'},
            {column: 'packReferences', value: 'TEXT'},
            {column: 'quantities', value: 'TEXT'},
            {column: 'packs', value: 'TEXT'},
            {column: 'draft', value: 'INTEGER'},
            {column: 'comment', value: 'TEXT'},
            {column: 'groupedSignatureStatusColor', value: 'VARCHAR(255)'},
            {column: 'createdBy', value: 'INTEGER'},
            {column: 'updatedAt', value: 'VARCHAR(255)'},
            {column: 'validatedAt', value: 'VARCHAR(255)'},
            {column: 'historyStatusesId', value: 'VARCHAR(255)'},
        ]
    },
    {
        name: 'dispatch_pack',
        schema: [
            {column: 'localId', value: 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            {column: 'id', value: 'INTEGER'},
            {column: 'code', value: 'VARCHAR(255)'},
            {column: 'natureId', value: 'INTEGER'},
            {column: 'quantity', value: 'INTEGER'},
            {column: 'dispatchId', value: 'INTEGER'},
            {column: 'localDispatchId', value: 'INTEGER'},
            {column: 'lastLocation', value: 'VARCHAR(255)'},
            {column: 'treated', value: 'INTEGER'},
            {column: 'already_treated', value: 'INTEGER'},
            {column: 'comment', value: 'VARCHAR(255)'},
            {column: 'volume', value: 'REAL'},
            {column: 'weight', value: 'REAL'},
            {column: 'photo1', value: 'TEXT'},
            {column: 'photo2', value: 'TEXT'},
        ]
    },
    {
        name: 'status',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'label', value: 'VARCHAR(255)'},
            {column: 'typeId', value: 'INTEGER'},
            {column: 'state', value: 'VARCHAR(255)'},
            {column: 'stateNumber', value: 'INTEGER'},
            {column: 'category', value: 'VARCHAR(255)'},
            {column: 'displayOrder', value: 'INTEGER'},
            {column: 'commentNeeded', value: 'INTEGER'},
            {column: 'groupedSignatureType', value: 'VARCHAR(255)'},
            {column: 'groupedSignatureColor', value: 'VARCHAR(255)'},
        ]
    },
    {
        name: 'empty_round',
        schema: [
            {column: 'location', value: 'VARCHAR(255)'},
            {column: 'comment', value: 'TEXT'},
            {column: 'date', value: 'VARCHAR(255)'}
        ]
    },
    {
        name: 'transport_round',
        schema: [
            {column: 'id', value: 'INTEGER'},
            {column: 'number', value: 'VARCHAR(255)'},
            {column: 'status', value: 'VARCHAR(255)'},
        ]
    },
    {
        name: 'transport_round_line',
        schema: [
            {column: 'order_id', value: 'INTEGER'},
            {column: 'contact_name', value: 'VARCHAR(255)'},
            {column: 'contact_address', value: 'VARCHAR(255)'},
            {column: 'request_type', value: 'VARCHAR(255)'},
            {column: 'priority', value: 'INTEGER'},
            {column: 'estimated_at', value: 'VARCHAR(255)'},
            {column: 'expected_at', value: 'VARCHAR(255)'},
        ]
    },
    {
        name: 'dispatch_type',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'label', value: 'VARCHAR(255)'},
        ]
    },
    {
        name: 'type',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'label', value: 'VARCHAR(255)'},
            {column: 'category', value: 'VARCHAR(255)'},
            {column: 'suggestedDropLocations', value: 'TEXT'},
            {column: 'suggestedPickLocations', value: 'TEXT'},
            {column: 'reusableStatuses', value: 'INTEGER'}
        ]
    },
    {
        name: 'supplier',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'label', value: 'VARCHAR(255)'},
            {column: 'code', value: 'VARCHAR(255)'}
        ]
    },
    {
        name: 'reference_article',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'reference', value: 'VARCHAR(255)'},
            {column: 'outFormatEquipment', value: 'VARCHAR(255)'},
            {column: 'manufacturerCode', value: 'VARCHAR(255)'},
            {column: 'length', value: 'REAL'},
            {column: 'width', value: 'REAL'},
            {column: 'height', value: 'REAL'},
            {column: 'volume', value: 'REAL'},
            {column: 'weight', value: 'REAL'},
            {column: 'associatedDocumentTypes', value: 'JSON'},
            {column: 'storageRuleLocations', value: 'VARCHAR(255)'},
        ]
    },
    {
        name: 'supplier_reference',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'label', value: 'VARCHAR(255)'},
        ]
    },
    {
        name: 'user',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'username', value: 'VARCHAR(255)'},
            {column: 'signatoryPassword', value: 'VARCHAR(255)'},
        ]
    },
    {
        name: 'dispatch_reference',
        schema: [
            {column: 'reference', value: 'VARCHAR(255)'},
            {column: 'localDispatchPackId', value: 'INTEGER'},
            {column: 'quantity', value: 'INTEGER'},
            {column: 'outFormatEquipment', value: 'VARCHAR(255)'},
            {column: 'manufacturerCode', value: 'VARCHAR(255)'},
            {column: 'sealingNumber', value: 'VARCHAR(255)'},
            {column: 'serialNumber', value: 'VARCHAR(255)'},
            {column: 'batchNumber', value: 'VARCHAR(255)'},
            {column: 'width', value: 'REAL'},
            {column: 'height', value: 'REAL'},
            {column: 'length', value: 'REAL'},
            {column: 'volume', value: 'REAL'},
            {column: 'weight', value: 'REAL'},
            {column: 'adr', value: 'INTEGER'},
            {column: 'associatedDocumentTypes', value: 'TEXT'},
            {column: 'comment', value: 'TEXT'},
            {column: 'photos', value: 'TEXT'},
        ]
    },
    {
        name: 'project',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'code', value: 'VARCHAR(255)'},
        ]
    },
    {
        name: 'inventory_mission',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'mission_start', value: 'VARCHAR(255)'},
            {column: 'mission_end', value: 'VARCHAR(255)'},
            {column: 'mission_name', value: 'VARCHAR(255)'},
            {column: 'type', value: 'VARCHAR(255)'},
        ]
    },
    {
        name: 'inventory_location_line',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'location_id', value: 'INTEGER'},
            {column: 'location_label', value: 'VARCHAR(255)'},
            {column: 'mission_id', value: 'INTEGER'},
            {column: 'zone_id', value: 'INTEGER'},
            {column: 'zone_label', value: 'VARCHAR(255)'},
            {column: 'done', value: 'INTEGER'},
            {column: 'validated_at', value: 'VARCHAR(255)'},
        ]
    },
    {
        name: 'inventory_location_tag',
        schema: [
            {column: 'mission_id', value: 'INTEGER'},
            {column: 'zone_id', value: 'INTEGER'},
            {column: 'tag', value: 'TEXT'},
        ]
    },
    {
        name: 'driver',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'label', value: 'VARCHAR(255)'},
            {column: 'prenom', value: 'VARCHAR(255)'},
            {column: 'id_transporteur', value: 'INTEGER'},
        ]
    },
    {
        name: 'carrier',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'label', value: 'VARCHAR(255)'},
            {column: 'logo', value: 'TEXT'},
            {column: 'minTrackingNumberLength', value: 'INTEGER'},
            {column: 'maxTrackingNumberLength', value: 'INTEGER'},
            {column: 'recurrent', value: 'INTEGER'},
        ]
    },
    {
        name: 'dispatch_waybill',
        schema: [
            {column: 'carrier', value: 'VARCHAR(255)'},
            {column: 'consignor', value: 'VARCHAR(255)'},
            {column: 'consignorEmail', value: 'VARCHAR(255)'},
            {column: 'consignorUsername', value: 'VARCHAR(255)'},
            {column: 'dispatchDate', value: 'VARCHAR(255)'},
            {column: 'locationFrom', value: 'VARCHAR(255)'},
            {column: 'locationTo', value: 'VARCHAR(255)'},
            {column: 'notes', value: 'TEXT'},
            {column: 'receiver', value: 'VARCHAR(255)'},
            {column: 'receiverEmail', value: 'VARCHAR(255)'},
            {column: 'receiverUsername', value: 'VARCHAR(255)'},
            {column: 'localId', value: 'INTEGER'},
        ]
    },
    {
        name: 'grouped_signature_history',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'groupedSignatureType', value: 'VARCHAR(255)'},
            {column: 'location', value: 'TEXT'},
            {column: 'signatory', value: 'INTEGER'},
            {column: 'operateur', value: 'VARCHAR(255)'},
            {column: 'statutFrom', value: 'INTEGER'},
            {column: 'statutTo', value: 'INTEGER'},
            {column: 'signatureDate', value: 'VARCHAR(255)'},
            {column: 'comment', value: 'TEXT'},
            {column: 'localDispatchId', value: 'INTEGER'},
            {column: 'dispatchId', value: 'INTEGER'},
        ]
    },
    {
        name: 'dispatch_emergency',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            {column: 'label', value: 'VARCHAR(255)'},
        ]
    },
    {
        name: 'associated_document_type',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            {column: 'label', value: 'VARCHAR(255)'},
        ]
    },
    {
        name: 'reserve_type',
        schema: [
            {column: 'id', value: 'INTEGER PRIMARY KEY'},
            {column: 'label', value: 'VARCHAR(255)'},
            {column: 'defaultReserveType', value: 'INTEGER'},
        ]
    },
];
