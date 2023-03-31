import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {TransportRoundFinishPackDropPage} from './transport-round-finish-pack-drop.page';

const routes: Routes = [
    {
        path: '',
        component: TransportRoundFinishPackDropPage
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TransportRoundFinishPackDropPageRoutingModule {
}
