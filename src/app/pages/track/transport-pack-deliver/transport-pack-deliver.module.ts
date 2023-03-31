import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TransportPackDeliverPageRoutingModule} from './transport-pack-deliver-routing.module';
import {TransportPackDeliverPage} from './transport-pack-deliver.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        CommonModule,
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TransportPackDeliverPageRoutingModule
    ],
    declarations: [TransportPackDeliverPage]
})
export class TransportPackDeliverPageModule {
}
