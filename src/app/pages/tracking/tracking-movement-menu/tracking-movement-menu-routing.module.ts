import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';
import {TrackingMovementMenuPage} from './tracking-movement-menu.page';

const routes: Routes = [
    {
        path: '',
        component: TrackingMovementMenuPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TrackingMovementMenuPageRoutingModule {
}
