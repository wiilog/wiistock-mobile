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

export interface ManagerResult extends RunResult {
    error?: {
        code: string;
        message: string;
    };
}

export interface DeviceInfoResult {
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

export enum ErrorCodeEnum {
    ACTION_INVALID = 'ACTION_INVALID',
    ACTION_REQUIRED = 'ACTION_REQUIRED',
    READER_ALREADY_CONNECTED = 'READER_ALREADY_CONNECTED',
    RETRIEVE_AVAILABLE_READERS_LIST_FAILURE = 'RETRIEVE_AVAILABLE_READERS_LIST_FAILURE',
    READER_CONNECTION_FAILURE = 'READER_CONNECTION_FAILURE',
    READER_CONNECTION_FAILURE_NOT_CONFIGURED = 'READER_CONNECTION_FAILURE_NOT_CONFIGURED',
    READER_CONNECTION_FAILURE_RFID_COMM_OPEN_ERROR = 'READER_CONNECTION_FAILURE_RFID_COMM_OPEN_ERROR',
    NO_READER_FOUND = 'NO_READER_FOUND',
    READER_ALREADY_DISCONNECTED = 'READER_ALREADY_DISCONNECTED',
    READER_DISCONNECTION_FAILURE = 'READER_DISCONNECTION_FAILURE',
    READER_CONFIGURATION_FAILED = 'READER_CONFIGURATION_FAILED',
    READER_NOT_CONNECTED = 'READER_NOT_CONNECTED',
    SCAN_STOP_FAILED = 'SCAN_STOP_FAILED',
    SCAN_STOP_FAILED_NO_INVENTORY_IN_PROGRESS = 'SCAN_STOP_FAILED_NO_INVENTORY_IN_PROGRESS',
    SCAN_START_FAILED = 'SCAN_START_FAILED',
    SCAN_START_FAILED_INVENTORY_ALREADY_IN_PROGRESS = 'SCAN_START_FAILED_INVENTORY_ALREADY_IN_PROGRESS',
}

export interface RfidManagerPlugin extends Plugin {
    deviceInfo(): Promise<DeviceInfoResult>;
    run(options: RunOptions): Promise<RunResult>;

    addListener(event: PluginEvent, listener: (data: any) => void): Promise<PluginListenerHandle>;
}
