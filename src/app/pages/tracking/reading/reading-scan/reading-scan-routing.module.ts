import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ReadingScanPage} from './reading-scan.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: ReadingScanPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ReadingScanRoutingModule {
}
