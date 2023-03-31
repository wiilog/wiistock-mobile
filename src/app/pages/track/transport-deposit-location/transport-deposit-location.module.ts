import {NgModule} from '@angular/core';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TransportDepositLocationPageRoutingModule} from './transport-deposit-location-routing.module';
import {TransportDepositLocationPage} from './transport-deposit-location.page';
import {CommonModule} from "@common/common.module";

@NgModule({
    imports: [
        CommonModule,
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TransportDepositLocationPageRoutingModule,
        CommonModule
    ],
    declarations: [TransportDepositLocationPage]
})
export class TransportDepositLocationPageModule {
}
