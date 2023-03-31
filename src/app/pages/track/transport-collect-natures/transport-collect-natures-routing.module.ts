import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {TransportCollectNaturesPage} from './transport-collect-natures.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: TransportCollectNaturesPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TransportCollectNaturesPageRoutingModule {
}
