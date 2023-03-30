import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {DeliveryLogisticUnitContentPage} from './delivery-logistic-unit-content.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: DeliveryLogisticUnitContentPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DeliveryLogisticUnitContentRoutingModule {
}
