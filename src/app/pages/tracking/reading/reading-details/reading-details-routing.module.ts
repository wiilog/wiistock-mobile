import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ReadingDetailsPage} from './reading-details.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: ReadingDetailsPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ReadingDetailsRoutingModule {
}
