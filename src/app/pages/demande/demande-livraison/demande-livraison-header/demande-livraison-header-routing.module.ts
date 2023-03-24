import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {DemandeLivraisonHeaderPage} from './demande-livraison-header.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: DemandeLivraisonHeaderPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DemandeLivraisonHeaderPageRoutingModule {
}
