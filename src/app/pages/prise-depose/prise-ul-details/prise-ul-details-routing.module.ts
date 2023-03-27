import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {PriseUlDetails} from './prise-ul-details.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: PriseUlDetails,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PriseUlDetailsRoutingModule {
}
