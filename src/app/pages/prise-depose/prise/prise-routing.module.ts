import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {PrisePage} from './prise.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: PrisePage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PrisePageRoutingModule {
}
