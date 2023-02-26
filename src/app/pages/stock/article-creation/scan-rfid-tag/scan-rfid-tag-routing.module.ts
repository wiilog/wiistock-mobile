import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {ScanRfidTagPage} from './scan-rfid-tag.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: ScanRfidTagPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ScanRfidTagRoutingModule {
}
