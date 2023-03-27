import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';
import {
    TruckArrivalReserveDetailsPage
} from "@pages/tracking/truck-arrival/truck-arrival-reserve-details/truck-arrival-reserve-details.page";

const routes: Routes = [
    {
        path: '',
        component: TruckArrivalReserveDetailsPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TruckArrivalReserveDetailsRoutingModule {
}
