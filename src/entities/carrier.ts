export interface Carrier {
    id: number;
    label: string;
    logo: string;
    recurrent?: boolean;
    minTrackingNumberLength?: number;
    maxTrackingNumberLength?: number;
}
