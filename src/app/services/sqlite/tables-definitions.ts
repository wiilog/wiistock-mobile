import {TableDefinition} from './table-definition';

export const TablesDefinitions: Array<TableDefinition> = [
    {
        name: 'emplacement',
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            label: 'VARCHAR(255)',
            temperature_ranges: 'VARCHAR(255)'
        }
    },
    {
        name: 'mouvement',
        attributes: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            reference: 'INTEGER',
            quantity: 'INTEGER',
            barcode: 'VARCHAR(255)',
            date_pickup: 'VARCHAR(255)',
            location_from: 'TEXT',
            date_drop: 'VARCHAR(255)',
            location: 'TEXT',
            type: 'VARCHAR(255)',
            is_ref: 'INTEGER',
            id_article_prepa: 'INTEGER',
            id_prepa: 'INTEGER',
            id_article_livraison: 'INTEGER',
            id_livraison: 'INTEGER',
            id_article_collecte: 'INTEGER',
            id_collecte: 'INTEGER',
            selected_by_article: 'INTEGER',
        }
    },
    {
        name: 'mouvement_traca',
        attributes: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            ref_article: 'VARCHAR(255)',
            date: 'VARCHAR(255)',
            ref_emplacement: 'VARCHAR(255)',
            type: 'VARCHAR(255)',
            operateur: 'VARCHAR(255)',
            comment: 'VARCHAR(255)',
            signature: 'TEXT',
            freeFields: 'TEXT',
            photo: 'TEXT',
            finished: 'INTEGER',
            fromStock: 'INTEGER',
            quantity: 'INTEGER',
            nature_id: 'INTEGER',
            isGroup: 'INTEGER',
            subPacks: 'TEXT',
            packParent: 'VARCHAR(255)',
            articles: 'JSON',
            containsArticle: 'INTEGER',
            projectId: 'INTEGER'
        }
    },
    {
        name: 'preparation',
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            numero: 'TEXT',
            emplacement: 'TEXT',
            date_end: 'TEXT',
            destination: 'TEXT',
            started: 'INTEGER',
            requester: 'VARCHAR(255)',
            type: 'VARCHAR(255)',
            comment: 'TEXT',
            expectedAt: 'TEXT',
            color: 'VARCHAR(255)',
            project: 'VARCHAR(255)'
        }
    },
    {
        name: 'article_prepa',
        attributes: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            label: 'TEXT',
            reference: 'TEXT',
            emplacement: 'TEXT',
            type_quantite: 'TEXT',
            barcode: 'TEXT',
            reference_article_reference: 'TEXT',
            quantite: 'INTEGER',
            is_ref: 'INTEGER',
            id_prepa: 'INTEGER',
            has_moved: 'INTEGER',
            isSelectableByUser: 'INTEGER',
            original_quantity: 'INTEGER',
            deleted: 'INTEGER DEFAULT 0',
            targetLocationPicking: 'TEXT',
            lineLogisticUnitId: 'INTEGER',
            lineLogisticUnitCode: 'TEXT',
            lineLogisticUnitNatureId: 'INTEGER',
            lineLogisticUnitLocation: 'TEXT',
        }
    },
    {
        name: 'article_prepa_by_ref_article',
        attributes: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            reference: 'TEXT',
            label: 'TEXT',
            location: 'TEXT',
            reference_article: 'TEXT',
            reference_barCode: 'VARCHAR(255)',
            barcode: 'TEXT',
            quantity: 'INTEGER',
            isSelectableByUser: 'INTEGER',
            management: 'VARCHAR(255)',
            management_date: 'VARCHAR(255)',
            management_order: 'INTEGER',
            pickingPriority: 'INTEGER',
        }
    },
    {
        name: 'livraison',
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            number: 'TEXT',
            location: 'TEXT',
            date_end: 'TEXT',
            requester: 'VARCHAR(255)',
            type: 'VARCHAR(255)',
            preparationLocation: 'VARCHAR(255)',
            comment: 'TEXT',
            expectedAt: 'TEXT',
            color: 'VARCHAR(255)',
            project: 'VARCHAR(255)'
        }
    },
    {
        name: 'collecte',
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            number: 'TEXT',
            date_end: 'TEXT',
            location_from: 'VARCHAR(255)',
            location_to: 'VARCHAR(255)',
            requester: 'VARCHAR(255)',
            type: 'VARCHAR(255)',
            forStock: 'INTEGER',
            comment: 'VARCHAR(255)'
        }
    },
    {
        name: 'transfer_order',
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            number: 'TEXT',
            requester: 'VARCHAR(255)',
            destination: 'VARCHAR(255)',
            origin: 'VARCHAR(255)',
            treated: 'INTEGER'
        }
    },
    {
        name: 'transfer_order_article',
        attributes: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            barcode: 'VARCHAR(255)',
            label: 'VARCHAR(255)',
            reference: 'VARCHAR(255)',
            location: 'VARCHAR(255)',
            quantity: 'INTEGER',
            transfer_order_id: 'INTEGER'
        }
    },
    {
        name: 'article_livraison',
        attributes: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            label: 'TEXT',
            reference: 'TEXT',
            location: 'TEXT',
            barcode: 'TEXT',
            quantity: 'INTEGER',
            is_ref: 'INTEGER',
            id_livraison: 'INTEGER',
            has_moved: 'INTEGER',
            targetLocationPicking: 'TEXT',
            currentLogisticUnitId: 'INTEGER',
            currentLogisticUnitCode: 'TEXT',
            currentLogisticUnitNatureId: 'TEXT',
            currentLogisticUnitLocation: 'TEXT',
        }
    },
    {
        name: 'article_inventaire',
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            reference: 'TEXT',
            location: 'TEXT',
            barcode: 'TEXT',
            mission_id: 'INTEGER',
            mission_start: 'VARCHAR(255)',
            mission_end: 'VARCHAR(255)',
            mission_name: 'VARCHAR(255)',
            is_ref: 'INTEGER',
            type: 'VARCHAR(255)',
            done: 'INTEGER',
            logistic_unit_code: 'VARCHAR(255)',
            logistic_unit_nature: 'VARCHAR(255)',
            logistic_unit_id: 'INTEGER',
        }
    },
    {
        name: 'article_collecte',
        attributes: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            label: 'TEXT',
            reference: 'TEXT',
            emplacement: 'TEXT',
            barcode: 'TEXT',
            quantite: 'INTEGER',
            is_ref: 'INTEGER',
            id_collecte: 'INTEGER',
            has_moved: 'INTEGER',
            reference_label: 'VARCHAR(255)',
            quantity_type: 'VARCHAR(255)'
        }
    },
    {
        name: 'picking_article_collecte',
        attributes: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            label: 'TEXT',
            reference: 'TEXT',
            reference_label: 'TEXT',
            barcode: 'TEXT',
            location: 'TEXT',
            is_ref: 'INTEGER'
        }
    },
    {
        name: 'saisie_inventaire',
        attributes: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            bar_code: 'VARCHAR(255)',
            date: 'TEXT',
            location: 'TEXT',
            mission_id: 'INTEGER',
            is_ref: 'INTEGER',
            quantity: 'INTEGER'
        }
    },
    {
        name: 'anomalie_inventaire',
        attributes: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            reference: 'TEXT',
            location: 'TEXT',
            comment: 'TEXT',
            barcode: 'TEXT',
            treated: 'TEXT',
            type: 'VARCHAR(255)',
            done: 'INTEGER',
            is_ref: 'INTEGER',
            quantity: 'INTEGER',
            is_treatable: 'INTEGER',
            countedQuantity: 'INTEGER',
            mission_id: 'INTEGER',
            mission_start: 'VARCHAR(255)',
            mission_end: 'VARCHAR(255)',
            mission_name: 'VARCHAR(255)',
        }
    },
    {
        name: 'handling',
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            number: 'VARCHAR(255)',
            typeId: 'INTEGER',
            statusId: 'INTEGER',
            carriedOutOperationCount: 'INTEGER',
            typeLabel: 'VARCHAR(255)',
            requester: 'VARCHAR(255)',
            desiredDate: 'VARCHAR(255)',
            comment: 'TEXT',
            destination: 'TEXT',
            source: 'TEXT',
            subject: 'VARCHAR(255)',
            emergency: 'VARCHAR(255)',
            freeFields: 'TEXT',
            color: 'VARCHAR(255)'
        }
    },
    {
        name: 'handling_attachment',
        attributes: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            fileName: 'VARCHAR(255)',
            href: 'VARCHAR(255)',
            handlingId: 'INTEGER'
        }
    },
    {
        name: 'demande_livraison',
        keepOnConnection: true,
        attributes: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            location_id: 'integer',
            comment: 'VARCHAR(255)',
            type_id: 'integer',
            user_id: 'integer',
            last_error: 'VARCHAR(255)',
            free_fields: 'TEXT',
        }
    },
    {
        name: 'article_in_demande_livraison',
        keepOnConnection: true,
        attributes: {
            demande_id: 'INTEGER',
            article_bar_code: 'VARCHAR(255)',
            quantity_to_pick: 'INTEGER'
        }
    },
    {
        name: 'demande_livraison_type',
        keepOnConnection: true,
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            label: 'VARCHAR(255)',
            to_delete: 'INTEGER'
        }
    },
    {
        name: 'demande_livraison_article',
        keepOnConnection: true,
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            label: 'VARCHAR(255)',
            reference: 'VARCHAR(255)',
            bar_code: 'VARCHAR(255)',
            type_quantity: 'VARCHAR(255)',
            location_label: 'VARCHAR(255)',
            available_quantity: 'INTEGER',
            to_delete: 'INTEGER'
        }
    },
    {
        name: 'free_field',
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            label: 'VARCHAR(255)',
            typeId: 'INTEGER',
            categoryType: 'VARCHAR(255)',
            typing: 'VARCHAR(255)',
            requiredCreate: 'INTEGER',
            requiredEdit: 'INTEGER',
            elements: 'TEXT',
            defaultValue: 'TEXT'
        }
    },
    {
        name: 'nature',
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            label: 'VARCHAR(255)',
            color: 'VARCHAR(255)',
            hide: 'INTEGER'
        }
    },
    {
        name: 'allowed_nature_location',
        attributes: {
            location_id: 'INTEGER',
            nature_id: 'INTEGER'
        }
    },
    {
        name: 'translations',
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            topMenu: 'VARCHAR(255)',
            subMenu: 'VARCHAR(255)',
            menu: 'VARCHAR(255)',
            label: 'VARCHAR(255)',
            translation: 'VARCHAR(255)'
        }
    },
    {
        name: 'dispatch',
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            requester: 'VARCHAR(255)',
            number: 'VARCHAR(255)',
            statusId: 'INTEGER',
            startDate: 'VARCHAR(255)',
            endDate: 'VARCHAR(255)',
            emergency: 'VARCHAR(255)',
            locationFromLabel: 'VARCHAR(255)',
            locationToLabel: 'VARCHAR(255)',
            typeId: 'INTEGER',
            typeLabel: 'VARCHAR(255)',
            statusLabel: 'VARCHAR(255)',
            treatedStatusId: 'INTEGER',
            partial: 'INTEGER',
            color: 'VARCHAR(255)',
            destination: 'VARCHAR(255)',
            draft: 'INTEGER'
        }
    },
    {
        name: 'dispatch_pack',
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            code: 'VARCHAR(255)',
            natureId: 'INTEGER',
            quantity: 'INTEGER',
            dispatchId: 'INTEGER',
            lastLocation: 'VARCHAR(255)',
            treated: 'INTEGER',
            already_treated: 'INTEGER',
            comment: 'VARCHAR(255)',
            photo1: 'TEXT',
            photo2: 'TEXT',
            reference: 'TEXT',
        }
    },
    {
        name: 'status',
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            label: 'VARCHAR(255)',
            typeId: 'INTEGER',
            state: 'VARCHAR(255)',
            category: 'VARCHAR(255)',
            displayOrder: 'INTEGER',
            commentNeeded: 'INTEGER'
        }
    },
    {
        name: 'empty_round',
        attributes: {
            location: 'VARCHAR(255)',
            comment: 'TEXT',
            date: 'VARCHAR(255)'
        }
    },
    {
        name: 'transport_round',
        attributes: {
            id: 'INTEGER',
            number: 'VARCHAR(255)',
            status: 'VARCHAR(255)',
        }
    },
    {
        name: 'transport_round_line',
        attributes: {
            order_id: 'INTEGER',
            contact_name: 'VARCHAR(255)',
            contact_address: 'VARCHAR(255)',
            request_type: 'VARCHAR(255)',
            priority: 'INTEGER',
            estimated_at: 'VARCHAR(255)',
            expected_at: 'VARCHAR(255)',
        }
    },
    {
        name: 'dispatch_type',
        keepOnConnection: true,
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            label: 'VARCHAR(255)',
        }
    },
    {
        name: 'user',
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            username: 'VARCHAR(255)',
        }
    },
    {
        name: 'reference',
        attributes: {
            reference: "VARCHAR(255)",
            quantity: "INTEGER",
            outFormatEquipment: "VARCHAR(255)",
            manufacturerCode: "VARCHAR(255)",
            sealingNumber: "VARCHAR(255)",
            serialNumber: "VARCHAR(255)",
            batchNumber: "VARCHAR(255)",
            width: "REAL",
            height: "REAL",
            length: "REAL",
            volume: "REAL",
            weight: "REAL",
            adr: "INTEGER",
            associatedDocumentTypes: "TEXT",
            comment: "TEXT",
            photos: "TEXT",
            logisticUnit: "VARCHAR(255)",
        }
    },
    {
        name: 'project',
        attributes: {
            id: 'INTEGER PRIMARY KEY',
            code: 'VARCHAR(255)',
        },
    },
];
