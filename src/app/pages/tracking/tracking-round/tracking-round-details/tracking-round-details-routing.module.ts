import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {TrackingRoundDetailsPage} from './tracking-round-details.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: TrackingRoundDetailsPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TrackingRoundDetailsRoutingModule {
}
