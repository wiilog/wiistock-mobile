import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';
import {
    TruckArrivalReserveDetailsPage
} from "@pages/tracking/truck-arrival/truck-arrival-reserve-details/truck-arrival-reserve-details.page";
import {
    TruckArrivalReserveDetailsRoutingModule
} from "@pages/tracking/truck-arrival/truck-arrival-reserve-details/truck-arrival-reserve-details-routing.module";

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TruckArrivalReserveDetailsRoutingModule,
        CommonModule
    ],
    declarations: [TruckArrivalReserveDetailsPage]
})
export class TruckArrivalReserveDetailsPageModule {
}
