export enum StorageKeyEnum {

    RIGHT_INVENTORY_MANAGER = 'inventoryManager',
    // RIGHT_DEMANDE = 'demande',
    // RIGHT_STOCK = 'stock',
    // RIGHT_TRACKING = 'tracking',
    RIGHT_TRACK = 'track',
    RIGHT_GROUP = 'group',
    RIGHT_UNGROUP = 'ungroup',
    RIGHT_EMPTY_ROUND = 'emptyRound',
    TRUCK_ARRIVAL = 'truckArrival',
    RIGHT_GROUPED_SIGNATURE = 'groupedSignature',
    RIGHT_CREATE_ARTICLE_FROM_NOMADE = 'createArticleFromNomade',
    RIGHT_PICK_AND_DROP_MENU = 'pickAndDrop',
    DEMO_MODE = 'demoMode',
    RIGHT_MOVEMENT = 'movement',
    RIGHT_DISPATCH = 'dispatch',
    RIGHT_RECEIPT_ASSOCIATION = 'receiptAssociation',
    RIGHT_PREPARATION = 'preparation',
    RIGHT_DELIVERY_ORDER = 'deliveryOrder',
    RIGHT_MANUAL_DELIVERY = 'manualDelivery',
    RIGHT_COLLECT_ORDER = 'collectOrder',
    RIGHT_MANUAL_COLLECT = 'manualCollect',
    RIGHT_TRANSFER_ORDER = 'transferOrder',
    RIGHT_MANUAL_TRANSFER = 'manualTransfer',
    RIGHT_INVENTORY = 'inventory',
    RIGHT_ARTICLE_UL_ASSOCIATION = 'articleUlAssociation',
    RIGHT_HANDLING = 'handling',
    RIGHT_DELIVERY_REQUEST = 'deliveryRequest',
    RIGHT_RECEPTION = 'reception',
    RIGHT_READING_MENU = 'readingMenu',

    FORCE_GROUPED_SIGNATURE = 'forceDispatchSignature',
    PARAMETER_SKIP_VALIDATION_MANUAL_TRANSFER = 'skipValidationsManualTransfer',
    PARAMETER_SKIP_VALIDATION_DELIVERY = 'skipValidationsLivraisons',
    PARAMETER_SKIP_VALIDATION_MANUAL_DELIVERY = 'manualDeliveryDisableValidations',
    PARAMETER_SKIP_QUANTITIES_DELIVERY = 'skipQuantitiesLivraisons',
    PARAMETER_SKIP_VALIDATION_PREPARATIONS = 'skipValidationsPreparations',
    PARAMETER_SKIP_QUANTITIES_PREPARATIONS = 'skipQuantitiesPreparations',
    PARAMETER_PREPARATION_DISPLAY_ARTICLE_WITHOUT_MANUAL = 'preparationDisplayArticleWithoutManual',
    PARAMETER_SKIP_VALIDATION_TO_TREAT_TRANSFER = 'skipValidationsToTreatTransfer',
    PARAMETER_DISPLAY_REFERENCES_ON_TRANSFER_CARDS = 'displayReferencesOnTransferCards',
    PARAMETER_DROP_ON_FREE_LOCATION = 'dropOnFreeLocation',
    PARAMETER_DELIVERY_REQUEST_ALLOWED_DROP_ON_FREE_LOCATION = 'deliveryRequestDropOnFreeLocation',
    PARAMETER_DISPLAY_TARGET_LOCATION_PICKING = 'displayTargetLocationPicking',
    PARAMETER_DISPLAY_REFERENCE_CODE_AND_SCAN = 'displayReferenceCodeAndScan',
    PARAMETER_ARTICLE_LOCATION_DROP_WITH_REFERENCE_STORAGE_RULE = 'articleLocationDropWithReferenceStorageRule',
    PARAMETER_DISPLAY_WARNING_WRONG_LOCATION = 'displayWarningWrongLocation',
    PARAMETER_DISPLAY_MANUAL_DELAY_START = 'displayManualDelayStart',
    PARAMETER_RFID_PREFIX = 'rfidPrefix',
    DISPATCH_OFFLINE_MODE = 'dispatchOfflineMode',
    ARRIVAL_NUMBER_FORMAT = 'arrivalNumberFormat',
    RFID_ON_MOBILE_TRACKING_MOVEMENTS = 'rfidOnMobileTrackingMovements',

    API_KEY = 'api-key',
    OPERATOR = 'operator',
    OPERATOR_ID = 'operator_id',
    NOTIFICATION_CHANNELS = 'notification_channels',

    URL_SERVER = 'url-server',

    IMAGE_SERVER_LOGIN = 'image_server_login',
    IMAGE_SERVER_HEADER = 'image_server_header',

    LOCAL_NOTIFICATIONS = 'local_notifications',

    COUNTERS = 'counters',
    COUNTERS_DISPATCHES_TREATED = 'counters_dispatches_treated',
    COUNTERS_HANDLINGS_TREATED = 'counters_handlings_treated',
    COUNTERS_TRANSFERS_TREATED = 'counters_transfers_treated',
    COUNTERS_PREPARATIONS_TREATED = 'counters_preparations_treated',
    COUNTERS_COLLECTS_TREATED = 'counters_collects_treated',
    COUNTERS_DELIVERIES_TREATED = 'counters_deliveries_treated',
    ARTICLE_CREATION_DEFAULT_VALUES = 'article_creation_default_values',

    DISPATCH_DEFAULT_WAYBILL = 'dispatch_default_waybill',

}
