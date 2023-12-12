import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {ReceiptAssociationLogisticUnitPageRoutingModule} from './receipt-association-logistic-unit-routing.module';
import {ReceiptAssociationLogisticUnitPage} from './receipt-association-logistic-unit.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from "@common/common.module";

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        ReceiptAssociationLogisticUnitPageRoutingModule,
        CommonModule,
        CommonModule
    ],
    declarations: [ReceiptAssociationLogisticUnitPage]
})
export class ReceiptAssociationLogisticUnitPageModule {
}
