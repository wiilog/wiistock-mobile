export interface GroupedSignatureHistory {
    id: number;
    groupedSignatureType: string;
    location?: string;
    signatureDate?: string;
    operateur?: string;
    dispatchToSignIds?: string;
    statutFrom?: number;
    statutTo?: number;
    signatory?: number;
}
