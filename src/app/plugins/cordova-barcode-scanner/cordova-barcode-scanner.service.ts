import {Injectable} from "@angular/core";
import {Observable, Subject} from "rxjs";
import {BarcodeScanOptions, BarcodeScanResult} from "./definitions";

declare const cordova: any;

@Injectable()
export class CordovaBarcodeScannerService {

    private static readonly DEFAULT_SCAN_OPTIONS: Partial<BarcodeScanOptions> = {
        preferFrontCamera: false,
        showFlipCameraButton: true,
        showTorchButton: true,
        torchOn: false,
        saveHistory: false,
        prompt: "Scannez un code barre",
        resultDisplayDuration: 1500,
        disableSuccessBeep: false, // iOS and Android
    };

    public scan(options?: Partial<BarcodeScanOptions>): Observable<BarcodeScanResult> {
        const finalOptions = {
            ...CordovaBarcodeScannerService.DEFAULT_SCAN_OPTIONS,
            ...(options || {}),
        };

        const subject$ = new Subject<BarcodeScanResult>();
        cordova.plugins.barcodeScanner.scan(
            function (result: BarcodeScanResult) {
                subject$.next(result);
                subject$.complete();
            },
            function (error: any) {
                subject$.error(error);
                subject$.complete();
            },
            finalOptions
        );
        return subject$;
    }
}
