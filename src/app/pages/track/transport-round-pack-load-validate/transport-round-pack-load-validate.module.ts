import {NgModule} from '@angular/core';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TransportRoundPackLoadConfirmPageRoutingModule} from './transport-round-pack-load-validate-routing.module';
import {TransportRoundPackLoadValidatePage} from './transport-round-pack-load-validate.page';
import {CommonModule} from "@common/common.module";

@NgModule({
    imports: [
        CommonModule,
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TransportRoundPackLoadConfirmPageRoutingModule,
        CommonModule
    ],
    declarations: [TransportRoundPackLoadValidatePage]
})
export class TransportRoundPackLoadConfirmPageModule {
}
