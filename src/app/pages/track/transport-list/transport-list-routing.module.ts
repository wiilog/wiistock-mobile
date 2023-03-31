import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {TransportListPage} from './transport-list.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: TransportListPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TransportListPageRoutingModule {
}
