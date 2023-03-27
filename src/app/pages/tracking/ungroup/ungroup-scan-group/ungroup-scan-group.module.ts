import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {UngroupScanGroupPageRoutingModule} from './ungroup-scan-group-routing.module';

import {UngroupScanGroupPage} from './ungroup-scan-group.page';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        UngroupScanGroupPageRoutingModule
    ],
    declarations: [UngroupScanGroupPage]
})
export class UngroupScanGroupPageModule {
}
