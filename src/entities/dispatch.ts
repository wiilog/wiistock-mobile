export interface Dispatch {
    id: number;
    requester: string;
    number: string;
    trackingNumber: string;
    startDate: string;
    endDate: string;
    emergency: string;
    locationFromLabel: string;
    locationToLabel: string;
    typeLabel: string;
    typeId: number;
    typeColor: string;
    treatedStatusId: number;
    partial: number;
    statusLabel: string;
    color: string;
    destination: string;
    comment: string;
    draft?: boolean;
}
