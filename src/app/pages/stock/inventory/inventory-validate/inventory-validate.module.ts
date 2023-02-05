import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {InventoryValidatePageRoutingModule} from './inventory-validate-routing.module';
import {InventoryValidatePage} from './inventory-validate.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        InventoryValidatePageRoutingModule,
        CommonModule
    ],
    declarations: [InventoryValidatePage]
})
export class InventoryValidatePageModule {
}
