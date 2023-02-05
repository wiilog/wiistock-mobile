import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {InventoryMissionZoneControlePage} from './inventory-mission-zone-controle.page';

const routes: Routes = [
    {
        path: '',
        component: InventoryMissionZoneControlePage,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class InventoryMissionZoneControlePageRoutingModule {
}
