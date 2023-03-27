import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {GroupScanGroupPageRoutingModule} from './group-scan-group-routing.module';

import {GroupScanGroupPage} from './group-scan-group.page';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        GroupScanGroupPageRoutingModule
    ],
    declarations: [GroupScanGroupPage]
})
export class GroupScanGroupPageModule {
}
