export interface FreeField {
    id: number;
    label: string;
    typeId: number;
    categoryType: string;
    typing: string;
    requiredCreate: number;
    requiredEdit: number;
    elements: string;
    defaultValue: string;
}

export enum FreeFieldType {
    TRACKING = 'mouvement traca',
    HANDLING = 'services',
    DELIVERY_REQUEST = 'demande livraison',
}

export enum FreeFieldTyping {
    BOOL = 'booleen',
    DATE = 'date',
    DATETIME = 'datetime',
    TEXT = 'text',
    NUMBER = 'number',
    LIST = 'list',
    MULTI_LIST = 'list multiple'
}
