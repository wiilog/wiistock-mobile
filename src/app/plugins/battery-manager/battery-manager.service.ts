import {Injectable} from "@angular/core";
import {registerPlugin} from "@capacitor/core";
import {
    BatteryInfoResult,
    BatteryManagerPlugin,
} from "./definitions";
import {from, Observable, Subject} from "rxjs";
import {PluginListenerHandle} from "@capacitor/core/types/definitions";

@Injectable()
export class BatteryManagerService {

    private plugin: BatteryManagerPlugin;

    private _stateChanged$?: Subject<BatteryInfoResult>;

    private eventsLaunched: boolean;

    private listener: PluginListenerHandle;

    public constructor() {
        this.eventsLaunched = false;
        this.plugin = registerPlugin<BatteryManagerPlugin>('BatteryManager');
    }

    public batteryInfo(): Observable<BatteryInfoResult> {
        return from(this.plugin.batteryInfo());
    }

    public get stateChanged$(): Observable<BatteryInfoResult> {
        if (!this._stateChanged$) {
            throw new Error("Event listeners not launched");
        }
        return this._stateChanged$;
    }


    public launchEventListeners(): void {
        if (this.eventsLaunched) {
            return;
        }

        this._stateChanged$ = new Subject();
        this.plugin.addListener('stateChanged', (data) => {
            this._stateChanged$?.next(data);
        }).then((listener) => {
            this.listener = listener;
        });

        this.eventsLaunched = true;
    }


    public removeEventListeners(): void {
        if (!this.eventsLaunched) {
            return;
        }

        if (this.listener) {
            this.listener.remove();
        }

        // this._scanStopped$ defined and not closed
        if (this._stateChanged$?.closed === false) {
            this._stateChanged$?.complete();
            this._stateChanged$?.unsubscribe();
        }
        this._stateChanged$ = undefined;

        this.eventsLaunched = false;
    }

}
