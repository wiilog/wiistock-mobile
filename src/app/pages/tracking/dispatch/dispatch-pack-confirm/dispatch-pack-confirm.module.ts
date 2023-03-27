import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {DispatchPackConfirmPageRoutingModule} from './dispatch-pack-confirm-routing.module';
import {DispatchPackConfirmPage} from './dispatch-pack-confirm.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        DispatchPackConfirmPageRoutingModule,
        CommonModule
    ],
    declarations: [DispatchPackConfirmPage]
})
export class DispatchPackConfirmPageModule {
}
