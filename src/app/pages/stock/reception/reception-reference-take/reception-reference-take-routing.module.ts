import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {ReceptionReferenceTakePage} from './reception-reference-take.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: ReceptionReferenceTakePage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ReceptionReferenceTakePageRoutingModule {
}
