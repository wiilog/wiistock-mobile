export interface ReceptionReferenceArticle {
    barCode: string;
    comment: string;
    emergency: boolean;
    id: number;
    orderNumber: string;
    quantityToReceive: number;
    receivedQuantity: number;
    reference: string;
    label: string;
    unitPrice: number;
}
