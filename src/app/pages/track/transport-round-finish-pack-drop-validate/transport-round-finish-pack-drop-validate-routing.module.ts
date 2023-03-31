import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {TransportRoundFinishPackDropValidatePage} from './transport-round-finish-pack-drop-validate.page';

const routes: Routes = [
    {
        path: '',
        component: TransportRoundFinishPackDropValidatePage
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TransportRoundFinishPackDropValidatePageRoutingModule {
}
