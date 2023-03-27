import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {MovementConfirmPage} from './movement-confirm.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: MovementConfirmPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class MovementConfirmPageRoutingModule {
}
