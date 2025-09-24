import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TrackingRoundListRoutingModule} from './tracking-round-list-routing.module';
import {TrackingRoundListPage} from './tracking-round-list.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TrackingRoundListRoutingModule,
        CommonModule
    ],
    declarations: [TrackingRoundListPage]
})
export class TrackingRoundListModule {
}
