import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {ManualDeliveryLocationPage} from './manual-delivery-location.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: ManualDeliveryLocationPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ManualDeliveryLocationRoutingModule {
}
