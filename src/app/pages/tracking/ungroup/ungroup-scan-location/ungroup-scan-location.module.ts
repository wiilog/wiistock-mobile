import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {UngroupScanLocationPageRoutingModule} from './ungroup-scan-location-routing.module';

import {UngroupScanLocationPage} from './ungroup-scan-location.page';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        UngroupScanLocationPageRoutingModule,
        CommonModule
    ],
    declarations: [UngroupScanLocationPage]
})
export class UngroupScanLocationPageModule {
}
