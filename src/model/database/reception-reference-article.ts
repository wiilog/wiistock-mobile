export interface ReceptionReferenceArticle {
    barcode: string;
    comment: string;
    emergency: boolean;
    id: number;
    orderNumber: string;
    remainingQuantity: number;
    quantityToReceive: number;
    receivedQuantity: number;
    reference: string;
    label: string;
    unitPrice: number;
}
