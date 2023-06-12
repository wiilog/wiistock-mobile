import {NgModule} from '@angular/core';
import {RfidManagerService} from "./rfid-manager/rfid-manager.service";
import {CordovaIntentShimService} from "@plugins/cordova-intent-shim/cordova-intent-shim.service";
import {CordovaBarcodeScannerService} from "@plugins/cordova-barcode-scanner/cordova-barcode-scanner.service";
import {BatteryManagerService} from "@plugins/battery-manager/battery-manager.service";

@NgModule({
    providers: [
        RfidManagerService,
        BatteryManagerService,
        CordovaIntentShimService,
        CordovaBarcodeScannerService,
    ],
})
export class PluginsModule {
}
