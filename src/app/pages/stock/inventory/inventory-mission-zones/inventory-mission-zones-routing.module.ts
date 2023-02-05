import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {InventoryMissionZonesPage} from './inventory-mission-zones.page';

const routes: Routes = [
    {
        path: '',
        component: InventoryMissionZonesPage,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class InventoryMissionZonesPageRoutingModule {
}
