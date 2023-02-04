import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {StockMenuPage} from './stock-menu.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: StockMenuPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class StockMenuPageRoutingModule {
}
