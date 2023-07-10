export interface DispatchReference {
    localDispatchPackId: number;
    reference: string;
    quantity: number;
    outFormatEquipment?: boolean;
    manufacturerCode: string;
    sealingNumber?: string;
    serialNumber: string;
    batchNumber: string;
    width: number;
    height: number;
    length: number;
    volume: number;
    weight: number;
    adr?: boolean;
    associatedDocumentTypes: string;
    comment?: string;
    photos?: Array<string>;
}
