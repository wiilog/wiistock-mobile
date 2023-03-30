import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {ManualDeliveryLocationRoutingModule} from './manual-delivery-location-routing.module';
import {ManualDeliveryLocationPage} from './manual-delivery-location.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        ManualDeliveryLocationRoutingModule,
        CommonModule
    ],
    declarations: [ManualDeliveryLocationPage]
})
export class ManualDeliveryLocationModule {
}
