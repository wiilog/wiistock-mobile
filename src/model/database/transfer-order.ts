export interface TransferOrder {
    id: number;
    number: string;
    requester: string;
    destination: string;
    origin: string;
    treated: number;
}
