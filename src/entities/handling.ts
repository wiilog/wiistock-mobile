export interface Handling {
    id: number;
    number: string;
    typeId: number;
    statusId: number;
    carriedOutOperationCount: number;
    typeLabel: string;
    desiredDate: string;
    requester: string;
    comment: string;
    destination: string;
    source: string;
    subject: string;
    emergency: string;
    freeFields: string;
    color: string;
}
