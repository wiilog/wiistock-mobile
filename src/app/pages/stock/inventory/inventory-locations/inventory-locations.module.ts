import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {InventoryLocationsPageRoutingModule} from './inventory-locations-routing.module';
import {InventoryLocationsPage} from './inventory-locations.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        InventoryLocationsPageRoutingModule,
        CommonModule
    ],
    declarations: [InventoryLocationsPage]
})
export class InventoryLocationsPageModule {
}
