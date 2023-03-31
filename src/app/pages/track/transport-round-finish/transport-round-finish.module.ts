import {NgModule} from '@angular/core';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TransportRoundFinishPageRoutingModule} from './transport-round-finish-routing.module';
import {TransportRoundFinishPage} from './transport-round-finish.page';
import {CommonModule} from "@common/common.module";

@NgModule({
    imports: [
        CommonModule,
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TransportRoundFinishPageRoutingModule,
        CommonModule
    ],
    declarations: [TransportRoundFinishPage]
})
export class TransportRoundFinishPageModule {
}
