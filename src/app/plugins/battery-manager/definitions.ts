import {Plugin, PluginListenerHandle} from "@capacitor/core/types/definitions";


export type BatteryPluginEvent = 'stateChanged';

export interface BatteryInfoResult {
    plugged: boolean;
    source?: "wireless"|"usb"|"ac";
    level: number;
}

export interface BatteryManagerPlugin extends Plugin {
    batteryInfo(): Promise<BatteryInfoResult>;

    addListener(event: BatteryPluginEvent, listener: (data: BatteryInfoResult) => void): Promise<PluginListenerHandle>;
}
