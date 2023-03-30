import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {CollecteArticleTakePage} from './collecte-article-take.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: CollecteArticleTakePage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class CollecteArticleTakePageRoutingModule {
}
