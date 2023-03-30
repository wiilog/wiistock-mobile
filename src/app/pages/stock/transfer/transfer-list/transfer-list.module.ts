import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TransferListPageRoutingModule} from './transfer-list-routing.module';
import {TransferListPage} from './transfer-list.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TransferListPageRoutingModule,
        CommonModule
    ],
    declarations: [TransferListPage]
})
export class TransferListPageModule {
}
