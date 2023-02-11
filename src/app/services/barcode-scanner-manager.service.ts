import {Injectable, NgZone} from '@angular/core';
// import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx'; // TODO WIIS-7970
import {Observable, Subject} from 'rxjs';
import {CordovaIntentShimService} from "@plugins/cordova-intent-shim/cordova-intent-shim.service";


@Injectable({
    providedIn: 'root'
})
export class BarcodeScannerManagerService {

    private readonly _datawedgeScan$: Subject<string>;

    private ngZone: NgZone;

    private zebraBroadcastReceiverAlreadyReceived: boolean;

    public constructor(private intentShimService: CordovaIntentShimService) {
        this._datawedgeScan$ = new Subject<string>();

        this.ngZone = new NgZone({enableLongStackTrace : false});
        this.zebraBroadcastReceiverAlreadyReceived = false;
    }

    public launchDatawedgeScanListener(): void {
        if (!this.zebraBroadcastReceiverAlreadyReceived) {
            this.zebraBroadcastReceiverAlreadyReceived = true;
            this.intentShimService.onWiistockDatawedgeScanning()
                .subscribe((intent) => {
                    this.ngZone.run(() => {
                        this._datawedgeScan$.next(intent.extras["com.symbol.datawedge.data_string"]);
                    });
                });
        }
    }

    /**
     * @return An observable fired when the zebra scanner is used. The param is the string barcode.
     */
    public get datawedgeScan$(): Observable<string> {
        return this._datawedgeScan$;
    }

    public scan(): Observable<string> {
        const subject = new Subject<string>();

        // TODO WIIS-7970
        // this.barcodeScanner.scan().then(res => {
        //     if (!res.cancelled) {
        //         subject.next(res.text);
        //     }
        //     subject.complete();
        // });

        return subject;
    }

    public startDatawedgeScanning(): Observable<void> {
        return this.intentShimService.triggerDatawedgeScan('START_SCANNING');
    }

    public stopDatawedgeScanning(): Observable<void> {
        return this.intentShimService.triggerDatawedgeScan('STOP_SCANNING');
    }

}
