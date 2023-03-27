import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';
import {TruckArrivalDriverPage} from '@pages/tracking/truck-arrival/truck-arrival-driver/truck-arrival-driver.page';

const routes: Routes = [
    {
        path: '',
        component: TruckArrivalDriverPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TruckArrivalDriverRoutingModule {
}
