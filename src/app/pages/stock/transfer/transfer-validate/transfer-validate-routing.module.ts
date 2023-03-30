import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {TransferValidatePage} from './transfer-validate.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: TransferValidatePage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TransferValidatePageRoutingModule {
}
