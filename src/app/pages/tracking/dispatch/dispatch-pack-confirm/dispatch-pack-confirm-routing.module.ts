import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {DispatchPackConfirmPage} from './dispatch-pack-confirm.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: DispatchPackConfirmPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DispatchPackConfirmPageRoutingModule {
}
