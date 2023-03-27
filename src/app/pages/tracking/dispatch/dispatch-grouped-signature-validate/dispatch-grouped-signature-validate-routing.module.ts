import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {DispatchGroupedSignatureValidatePage} from './dispatch-grouped-signature-validate.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: DispatchGroupedSignatureValidatePage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DispatchGroupedSignatureValidateRoutingModule {
}
