import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {DispatchNewPage} from './dispatch-new.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: DispatchNewPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DispatchNewRoutingModule {
}
