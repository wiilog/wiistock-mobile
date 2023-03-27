import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {NewEmplacementPage} from './new-emplacement.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: NewEmplacementPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class NewEmplacementPageRoutingModule {
}
