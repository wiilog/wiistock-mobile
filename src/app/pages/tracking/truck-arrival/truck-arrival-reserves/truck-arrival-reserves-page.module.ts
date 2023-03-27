import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';
import {
    TruckArrivalReservesRoutingModule
} from "@pages/tracking/truck-arrival/truck-arrival-reserves/truck-arrival-reserves-routing.module";
import {
    TruckArrivalReservesPage
} from "@pages/tracking/truck-arrival/truck-arrival-reserves/truck-arrival-reserves.page";

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TruckArrivalReservesRoutingModule,
        CommonModule
    ],
    declarations: [TruckArrivalReservesPage]
})
export class TruckArrivalReservesPageModule {
}
