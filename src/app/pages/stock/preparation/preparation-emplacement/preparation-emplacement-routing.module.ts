import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {PreparationEmplacementPage} from './preparation-emplacement.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: PreparationEmplacementPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PreparationEmplacementPageRoutingModule {
}
