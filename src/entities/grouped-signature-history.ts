export interface GroupedSignatureHistory {
    id: number;
    groupedSignatureType: string;
    location?: string;
    signatureDate?: string;
    operateur?: string;
    localDispatchId?: string;
    dispatchId?: string;
    statutFrom?: number;
    statutTo?: number;
    signatory?: number;
    comment?: string;
}
