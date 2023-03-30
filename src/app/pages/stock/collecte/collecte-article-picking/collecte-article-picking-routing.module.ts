import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {CollecteArticlePickingPage} from './collecte-article-picking.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: CollecteArticlePickingPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class CollecteArticlePickingPageRoutingModule {
}
