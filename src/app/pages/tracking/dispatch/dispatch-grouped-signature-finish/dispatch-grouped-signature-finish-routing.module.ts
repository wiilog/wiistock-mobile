import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {DispatchGroupedSignatureFinishPage} from './dispatch-grouped-signature-finish.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: DispatchGroupedSignatureFinishPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DispatchGroupedSignatureFinishPageRoutingModule {
}
