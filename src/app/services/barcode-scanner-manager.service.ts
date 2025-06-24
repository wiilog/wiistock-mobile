import {Injectable, NgZone} from '@angular/core';
import {mergeMap, Observable, of, Subject, throwError} from 'rxjs';
import {CordovaIntentShimService} from "@plugins/cordova-intent-shim/cordova-intent-shim.service";
import {CordovaBarcodeScannerService} from "@plugins/cordova-barcode-scanner/cordova-barcode-scanner.service";
import {BarcodeScanResult} from "@plugins/cordova-barcode-scanner/definitions";
import {filter} from "rxjs/operators";


@Injectable({
    providedIn: 'root'
})
export class BarcodeScannerManagerService {

    private readonly _datawedgeScan$: Subject<string>;

    private ngZone: NgZone;

    private _scanEnabled: boolean = true;

    private zebraBroadcastReceiverAlreadyReceived: boolean;

    public constructor(private intentShimService: CordovaIntentShimService,
                       private barcodeScanner: CordovaBarcodeScannerService) {
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
        return this._datawedgeScan$.pipe(
            filter(() => this._scanEnabled)
        );
    }

    public set scanEnabled(scanEnabled: boolean) {
        this._scanEnabled = scanEnabled;
    }

    public scan(): Observable<string> {
        return this.barcodeScanner.scan().pipe(
            mergeMap((result: BarcodeScanResult) => (
                result.cancelled
                    ? throwError(() => new Error('Cancelled'))
                    : of(result.text)
            ))
        );
    }

    public startDatawedgeScanning(): Observable<void> {
        return this.intentShimService.triggerDatawedgeScan('START_SCANNING');
    }

    public stopDatawedgeScanning(): Observable<void> {
        return this.intentShimService.triggerDatawedgeScan('STOP_SCANNING');
    }

}
