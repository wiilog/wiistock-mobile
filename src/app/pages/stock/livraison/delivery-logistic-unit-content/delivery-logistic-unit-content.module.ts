import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';
import {DeliveryLogisticUnitContentPage} from './delivery-logistic-unit-content.page';
import {DeliveryLogisticUnitContentRoutingModule} from './delivery-logistic-unit-content-routing.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        CommonModule,
        DeliveryLogisticUnitContentRoutingModule
    ],
    declarations: [DeliveryLogisticUnitContentPage]
})
export class DeliveryLogisticUnitContentModule {
}
