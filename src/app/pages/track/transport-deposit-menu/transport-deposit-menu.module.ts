import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TransportDepositMenuPageRoutingModule} from './transport-deposit-menu-routing.module';
import {TransportDepositMenuPage} from './transport-deposit-menu.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TransportDepositMenuPageRoutingModule,
        CommonModule
    ],
    declarations: [TransportDepositMenuPage]
})
export class TransportDepositMenuPageModule {
}
