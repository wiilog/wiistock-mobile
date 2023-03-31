import {NgModule} from '@angular/core';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TransportRoundFinishPackDropValidatePageRoutingModule} from './transport-round-finish-pack-drop-validate-routing.module';
import {TransportRoundFinishPackDropValidatePage} from './transport-round-finish-pack-drop-validate.page';
import {CommonModule} from "@common/common.module";

@NgModule({
    imports: [
        CommonModule,
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TransportRoundFinishPackDropValidatePageRoutingModule,
        CommonModule
    ],
    declarations: [TransportRoundFinishPackDropValidatePage]
})
export class TransportRoundFinishPackDropValidatePageModule {
}
