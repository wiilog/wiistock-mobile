import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {PreparationMenuPage} from './preparation-menu.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: PreparationMenuPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PreparationMenuPageRoutingModule {
}
