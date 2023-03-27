import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';
import {TruckArrivalLinesPage} from '@pages/tracking/truck-arrival/truck-arrival-lines/truck-arrival-lines.page';
import {TruckArrivalLinesRoutingModule} from '@pages/tracking/truck-arrival/truck-arrival-lines/truck-arrival-lines-routing.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TruckArrivalLinesRoutingModule,
        CommonModule
    ],
    declarations: [TruckArrivalLinesPage]
})
export class TruckArrivalLinesPageModule {
}
