import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {DispatchValidatePage} from './dispatch-validate.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: DispatchValidatePage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DispatchValidatePageRoutingModule {
}
