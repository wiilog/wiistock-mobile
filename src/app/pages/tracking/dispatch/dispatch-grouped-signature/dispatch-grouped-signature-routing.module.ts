import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {DispatchGroupedSignaturePage} from './dispatch-grouped-signature.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: DispatchGroupedSignaturePage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DispatchGroupedSignaturePageRoutingModule {
}
