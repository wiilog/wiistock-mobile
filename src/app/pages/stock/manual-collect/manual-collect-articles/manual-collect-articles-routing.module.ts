import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {ManualCollectArticlesPage} from './manual-collect-articles.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: ManualCollectArticlesPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ManualCollectArticlesPageRoutingModule {
}
