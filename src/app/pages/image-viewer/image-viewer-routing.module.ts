import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {ImageViewerPage} from './image-viewer.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: ImageViewerPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ImageViewerPageRoutingModule {
}
