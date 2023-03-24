import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {DemandeLivraisonArticlesPage} from './demande-livraison-articles.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: DemandeLivraisonArticlesPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DemandeLivraisonArticlesPageRoutingModule {
}
