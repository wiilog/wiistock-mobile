import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {DeposePage} from './depose.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: DeposePage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DeposePageRoutingModule {
}
