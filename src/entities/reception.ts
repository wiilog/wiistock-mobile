export interface Reception {
    id: number;
    number: string;
    status: string;
    expectedDate: { date: string; };
    orderDate: { date: string; };
    supplier: string;
    user: string;
    carrier: string;
    location: string;
    storageLocation: string;
    emergency: boolean;
    orderNumber?: Array<string>;
}
