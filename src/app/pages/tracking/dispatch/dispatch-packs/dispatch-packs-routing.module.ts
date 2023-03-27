import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {DispatchPacksPage} from './dispatch-packs.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: DispatchPacksPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DispatchPacksPageRoutingModule {
}
