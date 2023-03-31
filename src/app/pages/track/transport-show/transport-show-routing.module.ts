import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {TransportShowPage} from './transport-show.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: TransportShowPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TransportShowPageRoutingModule {
}
