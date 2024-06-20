import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {ReceptionDetailsPage} from './reception-details.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: ReceptionDetailsPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ReceptionDetailsModule {
}
