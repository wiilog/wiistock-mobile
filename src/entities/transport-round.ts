import {TransportRoundLine} from '@entities/transport-round-line';

export interface TransportRound {
    id: number;
    number: string;
    status: string;
    is_ongoing: boolean;
    date: string;
    estimated_distance: number;
    estimated_time: string;
    ready_deliveries: number;
    total_ready_deliveries: number;
    total_transports: number;
    done_transports: number;
    loaded_packs: number;
    total_loaded: number;
    collected_packs: number;
    to_collect_packs: number;
    lines: Array<TransportRoundLine>;
    to_finish: boolean;

    not_delivered: number;
    returned_packs: number;
    packs_to_return: number;

    done_collects: number;
    deposited_packs: number;
    packs_to_deposit: number;

    deposited_delivery_packs: boolean;
    deposited_collect_packs: boolean;
}
