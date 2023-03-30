import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {LivraisonEmplacementPage} from './livraison-emplacement.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: LivraisonEmplacementPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class LivraisonEmplacementPageRoutingModule {
}
