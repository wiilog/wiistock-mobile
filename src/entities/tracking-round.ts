export interface TrackingRound {
    id: number;
    number: string;
    typeLabel: string;
    typeColor: string;
    statusLabel: string;
    requestedBy: string;
    locationLabel: string;
    expectedAt: string;
    emergency?: string;
    isStarted: boolean;
    lines: any;
}
