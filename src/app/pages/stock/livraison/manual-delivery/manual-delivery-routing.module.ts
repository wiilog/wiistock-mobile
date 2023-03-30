import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {ManualDeliveryPage} from './manual-delivery.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: ManualDeliveryPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ManualDeliveryPageRoutingModule {
}
