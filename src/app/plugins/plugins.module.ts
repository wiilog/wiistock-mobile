import {NgModule} from '@angular/core';
import {RfidManagerService} from "./rfid-manager/rfid-manager.service";
import {CordovaIntentShimService} from "@plugins/cordova-intent-shim/cordova-intent-shim.service";
import {CordovaBarcodeScannerService} from "@plugins/cordova-barcode-scanner/cordova-barcode-scanner.service";

@NgModule({
    providers: [
        RfidManagerService,
        CordovaIntentShimService,
        CordovaBarcodeScannerService,
    ],
})
export class PluginsModule {
}
