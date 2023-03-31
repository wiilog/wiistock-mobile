import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TransportListPageRoutingModule} from './transport-list-routing.module';
import {TransportListPage} from './transport-list.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TransportListPageRoutingModule,
        CommonModule
    ],
    declarations: [TransportListPage]
})
export class TransportListPageModule {
}
