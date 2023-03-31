import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TransportShowPageRoutingModule} from './transport-show-routing.module';
import {TransportShowPage} from './transport-show.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TransportShowPageRoutingModule,
        CommonModule
    ],
    declarations: [TransportShowPage]
})
export class TransportShowPageModule {
}
