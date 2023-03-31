import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TransportRoundPackLoadPageRoutingModule} from './transport-round-pack-load-routing.module';
import {TransportRoundPackLoadPage} from './transport-round-pack-load.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        CommonModule,
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TransportRoundPackLoadPageRoutingModule
    ],
    declarations: [TransportRoundPackLoadPage]
})
export class TransportRoundPackLoadPageModule {
}
