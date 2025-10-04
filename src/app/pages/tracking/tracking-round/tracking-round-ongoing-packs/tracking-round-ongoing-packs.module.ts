import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TrackingRoundOngoingPacksRoutingModule} from './tracking-round-ongoing-packs-routing.module';
import {TrackingRoundOngoingPacksPage} from './tracking-round-ongoing-packs.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TrackingRoundOngoingPacksRoutingModule,
        CommonModule
    ],
    declarations: [TrackingRoundOngoingPacksPage]
})
export class TrackingRoundOngoingPacksModule {
}
