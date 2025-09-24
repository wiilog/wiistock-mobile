import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TrackingRoundDetailsRoutingModule} from './tracking-round-details-routing.module';
import {TrackingRoundDetailsPage} from './tracking-round-details.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TrackingRoundDetailsRoutingModule,
        CommonModule
    ],
    declarations: [TrackingRoundDetailsPage]
})
export class TrackingRoundDetailsModule {
}
