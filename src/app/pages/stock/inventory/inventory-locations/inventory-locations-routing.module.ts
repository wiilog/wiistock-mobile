import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {InventoryLocationsPage} from './inventory-locations.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: InventoryLocationsPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class InventoryLocationsPageRoutingModule {
}
