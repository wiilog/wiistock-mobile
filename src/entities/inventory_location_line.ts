export interface InventoryLocationLine {
    id: number;
    location_id: number;
    location_label: string;
    mission_id: number;
    zone_id: number;
    zone_label: string;
    done: number;
    validated_at: string;
}
