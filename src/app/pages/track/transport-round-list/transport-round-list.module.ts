import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TransportRoundListPageRoutingModule} from './transport-round-list-routing.module';
import {TransportRoundListPage} from './transport-round-list.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TransportRoundListPageRoutingModule,
        CommonModule
    ],
    declarations: [TransportRoundListPage]
})
export class TransportRoundListPageModule {
}
