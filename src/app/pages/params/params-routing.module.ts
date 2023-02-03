import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {ParamsPage} from './params.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: ParamsPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ParamsPageRoutingModule {
    public static readonly PATH: string = 'params';
}
