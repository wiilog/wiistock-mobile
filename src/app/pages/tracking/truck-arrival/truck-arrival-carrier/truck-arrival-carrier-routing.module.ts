import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';
import {TruckArrivalCarrierPage} from '@pages/tracking/truck-arrival/truck-arrival-carrier/truck-arrival-carrier.page';

const routes: Routes = [
    {
        path: '',
        component: TruckArrivalCarrierPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TruckArrivalCarrierRoutingModule {
}
