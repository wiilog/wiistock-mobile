import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {InventoryLocationsMissionsPageRoutingModule} from './inventory-locations-missions-routing.module';
import {InventoryLocationsMissionsPage} from './inventory-locations-missions.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        InventoryLocationsMissionsPageRoutingModule,
        CommonModule
    ],
    declarations: [InventoryLocationsMissionsPage]
})
export class InventoryLocationsMissionsPageModule {
}
