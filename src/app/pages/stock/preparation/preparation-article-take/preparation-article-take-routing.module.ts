import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {PreparationArticleTakePage} from './preparation-article-take.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: PreparationArticleTakePage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PreparationArticleTakePageRoutingModule {
}
