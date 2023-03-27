import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {EmplacementScanPage} from './emplacement-scan.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: EmplacementScanPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class EmplacementScanPageRoutingModule {
}
