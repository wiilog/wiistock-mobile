import {NgModule} from '@angular/core';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TransportRoundFinishPackDropPageRoutingModule} from './transport-round-finish-pack-drop-routing.module';
import {TransportRoundFinishPackDropPage} from './transport-round-finish-pack-drop.page';
import {CommonModule} from "@common/common.module";

@NgModule({
    imports: [
        CommonModule,
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TransportRoundFinishPackDropPageRoutingModule,
        CommonModule
    ],
    declarations: [TransportRoundFinishPackDropPage]
})
export class TransportRoundFinishPackDropPageModule {
}
