import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {LivraisonArticlesPage} from './livraison-articles.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: LivraisonArticlesPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class LivraisonArticlesPageRoutingModule {
}
