import {NgModule} from '@angular/core';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {UngroupConfirmPageRoutingModule} from './ungroup-confirm-routing.module';

import {UngroupConfirmPage} from './ungroup-confirm.page';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        CommonModule,
        AngularCommonModule,
        FormsModule,
        IonicModule,
        UngroupConfirmPageRoutingModule
    ],
    declarations: [UngroupConfirmPage]
})
export class UngroupConfirmPageModule {
}
