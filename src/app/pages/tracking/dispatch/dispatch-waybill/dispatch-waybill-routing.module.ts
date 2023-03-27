import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {DispatchWaybillPage} from './dispatch-waybill.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: DispatchWaybillPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DispatchWaybillRoutingModule {
}
