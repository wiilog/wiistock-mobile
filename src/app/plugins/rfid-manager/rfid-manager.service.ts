import {Injectable} from "@angular/core";
import {registerPlugin} from "@capacitor/core";
import {
    DeviceInfoResult,
    RfidManagerPlugin,
    RunResult,
    TagsReadData
} from "./definitions";
import {from, Observable, Subject} from "rxjs";
import {PluginListenerHandle} from "@capacitor/core/types/definitions";

@Injectable()
export class RfidManagerService {

    private rfidManagerPlugin: RfidManagerPlugin;

    private eventsLaunched: boolean;
    private listeners: Array<PluginListenerHandle>;

    private _tagsRead$?: Subject<{ tags: Array<string> }>;
    private _scanStarted$?: Subject<void>;
    private _scanStopped$?: Subject<void>;

    public constructor() {
        this.rfidManagerPlugin = registerPlugin<RfidManagerPlugin>('RfidManager');
        this.eventsLaunched = false;
        this.listeners = [];
    }

    public get tagsRead$(): Observable<TagsReadData> {
        if (!this._tagsRead$) {
            throw new Error("Event listeners not launched");
        }
        return this._tagsRead$;
    }

    public get scanStarted$(): Observable<void> {
        if (!this._scanStarted$) {
            throw new Error("Event listeners not launched");
        }
        return this._scanStarted$;
    }

    public get scanStopped$(): Observable<void> {
        if (!this._scanStopped$) {
            throw new Error("Event listeners not launched");
        }
        return this._scanStopped$;
    }

    public launchEventListeners(): void {
        if (this.eventsLaunched) {
            throw new Error("Event listeners already launched");
        }
        this._tagsRead$ = new Subject();
        this.rfidManagerPlugin
            .addListener('tagsRead', (data) => {
                this._tagsRead$?.next(data);
            })
            .then((listener) => {
                this.listeners.push(listener);
            });

        this._scanStarted$ = new Subject();
        this.rfidManagerPlugin
            .addListener('scanStarted', (data) => {
                this._scanStarted$?.next(data);
            })
            .then((listener) => {
                this.listeners.push(listener);
            });

        this._scanStopped$ = new Subject();
        this.rfidManagerPlugin
            .addListener('scanStopped', (data) => {
                this._scanStopped$?.next(data);
            })
            .then((listener) => {
                this.listeners.push(listener);
            });

        this.eventsLaunched = true;
    }

    public removeEventListeners(): void {
        this.listeners.forEach((listener) => {
            listener.remove();
        });
        this.listeners = [];

        this._tagsRead$?.complete();
        this._tagsRead$?.unsubscribe();
        this._tagsRead$ = undefined;

        this._scanStarted$?.complete();
        this._scanStarted$?.unsubscribe();
        this._scanStarted$ = undefined;

        this._scanStopped$?.complete();
        this._scanStopped$?.unsubscribe();
        this._scanStopped$ = undefined;

        this.eventsLaunched = false;
    }

    public connect(): Observable<RunResult> {
        return from(this.rfidManagerPlugin.run({action: 'connect'}));
    }

    public configure(): Observable<RunResult> {
        return from(this.rfidManagerPlugin.run({action: 'configure'}));
    }

    public startScan(): Observable<RunResult> {
        return from(this.rfidManagerPlugin.run({action: 'startScan'}));
    }

    public stopScan(): Observable<RunResult> {
        return from(this.rfidManagerPlugin.run({action: 'stopScan'}));
    }

    public deviceInfo(): Observable<DeviceInfoResult> {
        return from(this.rfidManagerPlugin.deviceInfo());// TODO test for return type
    }

    // TODO WIIS-7970
    public disconnect(): Observable<RunResult> {
        return from(this.rfidManagerPlugin.run({action: 'disconnect'}));
    }

}
