import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ReceiptAssociationMenuPage} from './receipt-association-menu.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: ReceiptAssociationMenuPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ReceiptAssociationMenuPageRoutingModule {
}
