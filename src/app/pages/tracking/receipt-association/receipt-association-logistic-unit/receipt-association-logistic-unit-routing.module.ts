import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ReceiptAssociationLogisticUnitPage} from './receipt-association-logistic-unit.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: ReceiptAssociationLogisticUnitPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ReceiptAssociationLogisticUnitPageRoutingModule {
}
