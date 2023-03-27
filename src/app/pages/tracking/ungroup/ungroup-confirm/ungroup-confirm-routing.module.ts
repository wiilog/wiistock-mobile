import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {UngroupConfirmPage} from './ungroup-confirm.page';

const routes: Routes = [
    {
        path: '',
        component: UngroupConfirmPage
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class UngroupConfirmPageRoutingModule {
}
