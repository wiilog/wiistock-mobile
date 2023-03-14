import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {AssociationPage} from './association.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: AssociationPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class AssociationRoutingModule {
}
