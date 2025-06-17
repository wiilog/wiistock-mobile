import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {ScanLocationsPage} from './scan-locations.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: ScanLocationsPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ScanLocationsPageRoutingModule {
}
