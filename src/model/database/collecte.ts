export interface Collecte {
    id: number;
    number: string;

    requester: string;
    type: string;

    location_from: string;
    location_to?: string;
    date_end?: string;
    forStock: number;
    comment?: string;
}
