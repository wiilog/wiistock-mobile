export interface GroupedSignatureHistory {
    id: number;
    groupedSignatureType: string;
    location?: string;
    signatureDate?: string;
    operateur?: string;
    localId?: string;
    dispatchId?: string;
    statutFrom?: number;
    statutTo?: number;
    signatory?: number;
    comment?: string;
}
