import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {FinishTransportPageRoutingModule} from './finish-transport-routing.module';
import {FinishTransportPage} from './finish-transport.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        FinishTransportPageRoutingModule,
        CommonModule
    ],
    declarations: [FinishTransportPage]
})
export class FinishTransportPageModule {
}
