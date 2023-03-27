import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';
import {TruckArrivalCarrierPage} from '@pages/tracking/truck-arrival/truck-arrival-carrier/truck-arrival-carrier.page';
import {TruckArrivalCarrierRoutingModule} from '@pages/tracking/truck-arrival/truck-arrival-carrier/truck-arrival-carrier-routing.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TruckArrivalCarrierRoutingModule,
        CommonModule
    ],
    declarations: [TruckArrivalCarrierPage]
})
export class TruckArrivalCarrierPageModule {
}
