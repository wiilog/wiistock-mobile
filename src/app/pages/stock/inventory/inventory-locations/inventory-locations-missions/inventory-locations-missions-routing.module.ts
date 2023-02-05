import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {InventoryLocationsMissionsPage} from './inventory-locations-missions.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: InventoryLocationsMissionsPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class InventoryLocationsMissionsPageRoutingModule {
}
