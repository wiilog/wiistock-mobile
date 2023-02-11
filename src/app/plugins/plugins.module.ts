import {NgModule} from '@angular/core';
import {RfidManagerService} from "./rfid-manager/rfid-manager.service";
import {CordovaIntentShimService} from "@plugins/cordova-intent-shim/cordova-intent-shim.service";

@NgModule({
    providers: [
        RfidManagerService,
        CordovaIntentShimService,
    ],
})
export class PluginsModule {
}
