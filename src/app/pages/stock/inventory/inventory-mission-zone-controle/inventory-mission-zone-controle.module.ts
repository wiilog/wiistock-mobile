import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {InventoryMissionZoneControlePageRoutingModule} from './inventory-mission-zone-controle-routing.module';
import {InventoryMissionZoneControlePage} from './inventory-mission-zone-controle.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        InventoryMissionZoneControlePageRoutingModule,
        CommonModule
    ],
    declarations: [InventoryMissionZoneControlePage]
})
export class InventoryMissionZoneControlePageModule {
}
