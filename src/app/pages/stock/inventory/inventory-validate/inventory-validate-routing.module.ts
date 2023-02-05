import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {InventoryValidatePage} from './inventory-validate.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: InventoryValidatePage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class InventoryValidatePageRoutingModule {
}
