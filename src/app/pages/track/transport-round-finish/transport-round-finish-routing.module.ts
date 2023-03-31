import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {TransportRoundFinishPage} from './transport-round-finish.page';

const routes: Routes = [
    {
        path: '',
        component: TransportRoundFinishPage
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TransportRoundFinishPageRoutingModule {
}
