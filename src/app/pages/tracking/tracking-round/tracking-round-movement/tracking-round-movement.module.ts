import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TrackingRoundMovementRoutingModule} from './tracking-round-movement-routing.module';
import {TrackingRoundMovementPage} from './tracking-round-movement.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TrackingRoundMovementRoutingModule,
        CommonModule
    ],
    declarations: [TrackingRoundMovementPage]
})
export class TrackingRoundMovementModule {
}
