import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';
import {TruckArrivalLinesPage} from "@pages/tracking/truck-arrival/truck-arrival-lines/truck-arrival-lines.page";

const routes: Routes = [
    {
        path: '',
        component: TruckArrivalLinesPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TruckArrivalLinesRoutingModule {
}
