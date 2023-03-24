import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {ImageViewerPage} from './image-viewer.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {ImageViewerPageRoutingModule} from './image-viewer-routing.module';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        ImageViewerPageRoutingModule,
        CommonModule
    ],
    declarations: [ImageViewerPage]
})
export class ImageViewerPageModule {
}
