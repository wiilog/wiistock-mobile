import {Injectable} from "@angular/core";
import {Observable, Subject} from "rxjs";
import {DatawedgeScanningResult} from "@plugins/cordova-intent-shim/definitions";

declare let window: any;

@Injectable()
export class CordovaIntentShimService {

    public onWiistockDatawedgeScanning(): Observable<DatawedgeScanningResult> {
        return this.registerBroadcastReceiver({
            filterActions: ['com.wiilog.wiistock.ACTION'],
            filterCategories: ['android.intent.category.DEFAULT']
        });
    }

    public triggerDatawedgeScan(action: 'START_SCANNING'|'STOP_SCANNING'): Observable<void> {
        return this.sendBroadcast(
            {
                action: "com.symbol.datawedge.api.ACTION",
                extras: {
                    'com.symbol.datawedge.api.SOFT_SCAN_TRIGGER': action
                }
            });
    }

    private registerBroadcastReceiver({filterActions, filterCategories}: {filterActions: Array<string>, filterCategories: Array<string>}): Observable<any> {
        const subject$ = new Subject<any>();
        window.plugins.intentShim.registerBroadcastReceiver(
            {filterActions, filterCategories},
            (intent: any) => {
                subject$.next(intent);
            });
        return subject$;
    }

    private sendBroadcast({action, extras}: {action: string, extras: {[_: string]: string}}): Observable<any> {
        const subject$ = new Subject<void>();
        window.plugins.intentShim.sendBroadcast(
            { action, extras },
            () => {
                subject$.next();
                subject$.complete();
            },
            () => {
                subject$.error('Error');
                subject$.complete();
            },
        );
        return subject$;
    }

}
