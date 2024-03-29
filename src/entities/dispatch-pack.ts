
export interface DispatchPack {
    id?: number;
    localId?: number;
    code: string;
    natureId?: number;
    quantity: number;
    dispatchId: number;
    localDispatchId: number;
    lastLocation?: string;
    treated?: number;
    already_treated?: number;
    comment?: string;
    volume: number;
    weight: number;
    photo1?: string;
    photo2?: string;
}
