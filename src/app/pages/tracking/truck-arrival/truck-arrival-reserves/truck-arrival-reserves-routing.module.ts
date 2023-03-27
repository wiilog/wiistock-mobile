import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';
import {
    TruckArrivalReservesPage
} from "@pages/tracking/truck-arrival/truck-arrival-reserves/truck-arrival-reserves.page";

const routes: Routes = [
    {
        path: '',
        component: TruckArrivalReservesPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TruckArrivalReservesRoutingModule {
}
