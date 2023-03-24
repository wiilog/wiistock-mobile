import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {HandlingMenuPage} from './handling-menu.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: HandlingMenuPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class HandlingMenuPageRoutingModule {
}
