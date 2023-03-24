import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';
import {HandlingValidatePage} from '@pages/demande/handling/handling-validate/handling-validate.page';

const routes: Routes = [
    {
        path: '',
        component: HandlingValidatePage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class HandlingValidatePageRoutingModule {
}
