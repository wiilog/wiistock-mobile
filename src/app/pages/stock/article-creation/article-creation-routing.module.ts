import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {ArticleCreationPage} from './article-creation.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: ArticleCreationPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ArticleCreationRoutingModule {
}
