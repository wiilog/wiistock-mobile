import {Plugin, PluginListenerHandle} from "@capacitor/core/types/definitions";

type RunAction = 'connect'
               | 'disconnect'
               | 'configure'
               | 'startScan'
               | 'stopScan'
    ;

type PluginEvent = 'tagsRead'
                 | 'scanStarted'
                 | 'scanStopped'
    ;

export interface RunOptions {
    action: RunAction;
}

export interface RunResult {
    success: boolean;
}

export interface DeviceInfoResult extends RunResult {
    address: string;
    name: string;
    serialNumber: string;
    transport: string;

    reader: {
        id: number;
        modelName: string;
        communicationStandard: string|null;
        countryCode: string;
        firmwareVersion: string;
        RSSIFilter: string;
        tagEventReporting: string;
        tagLocatingReporting: string;
        NXPCommandSupport: boolean;
        blockEraseSupport: boolean;
        blockWriteSupport: boolean;
        blockPermalockSupport: boolean;
        recommisionSupport: boolean;
        writeWMISupport: boolean;
        radioPowerControlSupport: boolean;
        hoppingEnabled: boolean;
        stateAwareSingulationCapable: boolean;
        UTCClockCapable: boolean;
        numOperationsInAccessSequence: number;
        numPreFilters: number;
        numAntennaSupported: number;
    };
}

export interface RfidManagerPlugin extends Plugin {
    deviceInfo(): Promise<DeviceInfoResult>;
    run(options: RunOptions): Promise<RunResult>;

    addListener(event: PluginEvent, listener: (data: any) => void): Promise<PluginListenerHandle>;
}
