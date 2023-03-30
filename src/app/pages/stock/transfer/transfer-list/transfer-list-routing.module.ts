import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {TransferListPage} from './transfer-list.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: TransferListPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TransferListPageRoutingModule {
    public static readonly PATH: string = 'transfer-list';
}
