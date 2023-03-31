import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {TransportDepositMenuPage} from './transport-deposit-menu.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: TransportDepositMenuPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TransportDepositMenuPageRoutingModule {
}
