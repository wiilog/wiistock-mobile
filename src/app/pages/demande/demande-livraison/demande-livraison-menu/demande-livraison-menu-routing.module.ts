import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {DemandeLivraisonMenuPage} from './demande-livraison-menu.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: DemandeLivraisonMenuPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DemandeLivraisonMenuPageRoutingModule {
}
