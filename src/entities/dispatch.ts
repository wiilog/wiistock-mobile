export interface Dispatch {
    localId: number;// local sqlite id
    id?: number; // id on the server, undefined if dispatch created on device
    createdAt: string;
    requester: string;
    number?: string;
    carrierTrackingNumber: string;
    startDate?: string;
    endDate?: string;
    emergency: string;
    locationFromLabel: string;
    locationFromId: number;
    locationToLabel: string;
    locationToId: number;
    typeLabel: string;
    typeId: number;
    typeColor: string;
    treatedStatusId: number;
    partial: number;
    statusLabel: string;
    statusId: number;
    color: string;
    destination?: string;
    comment: string;
    packReferences?: string;
    quantities?: string;
    packs?: string;
    draft?: boolean;
    groupedSignatureStatusColor?: string;
    createdBy: number;
    updatedAt?: string;
    validatedAt?: string;
}
