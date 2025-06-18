import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {PickAndDropPage} from './pick-and-drop.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: PickAndDropPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PickAndDropPageRoutingModule {
}
