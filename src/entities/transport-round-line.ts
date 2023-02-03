import {TransportRound} from '@entities/transport-round';

export interface TransportRoundLine {
    id: number;
    round: TransportRound;
    from_delivery: boolean;
    number: string;
    type: string;
    type_icon: string;
    collect: TransportRoundLine;
    status: string;
    kind: `delivery` | `collect`;
    natures_to_collect: Array<{
        nature_id: number;
        nature: string;
        color: string;
        quantity_to_collect: number;
        collected_quantity: number;
        deposited_quantity: number;
    }>;
    packs: Array<TransportPack>;
    expected_at: string;
    expected_time: string;
    estimated_time: string;
    fulfilled_time: string;
    time_slot: string;
    emergency: string;
    contact: {
        file_number: string;
        name: string;
        address: string;
        contact: string;
        person_to_contact: string;
        observation: string;
        latitude: string;
        longitude: string;
    };
    comment: string|null;
    photos: Array<string>|null; // urls des photos
    signature: string|null; // url de la signature
    reject_motive: string|null;
    requester: string;
    free_fields: Array<{
        id: number,
        label: string,
        value: string
    }>;
    priority: number;
    cancelled: boolean;
    success: boolean;
    failure: boolean;
}

export interface TransportPack {
    code: string;
    nature: string;
    nature_id: number;
    temperature_range: string;
    color: string;
    loaded?: boolean;
    rejected?: boolean;
    delivered?: boolean;
    returned?: boolean;
    dropped?: boolean;
}
