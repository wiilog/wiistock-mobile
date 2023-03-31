import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TransportDepositPacksPageRoutingModule} from './transport-deposit-packs-routing.module';
import {TransportDepositPacksPage} from './transport-deposit-packs.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        CommonModule,
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TransportDepositPacksPageRoutingModule
    ],
    declarations: [TransportDepositPacksPage]
})
export class TransportDepositPacksPageModule {
}
