export interface Status {
    id: number;
    label: string;
    typeId: number;
    state: string;
    displayOrder: number;
    page: string;
    commentNeeded: number;
    groupedSignatureType?: string;
    groupedSignatureColor?: string;
}
