import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {TrackingRoundMovementPage} from './tracking-round-movement.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: TrackingRoundMovementPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TrackingRoundMovementRoutingModule {
}
