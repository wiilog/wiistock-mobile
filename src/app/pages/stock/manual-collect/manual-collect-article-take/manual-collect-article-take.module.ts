import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {ManualCollectArticleTakePageRoutingModule} from './manual-collect-article-take-routing.module';
import {ManualCollectArticleTakePage} from './manual-collect-article-take.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        ManualCollectArticleTakePageRoutingModule,
        CommonModule
    ],
    declarations: [ManualCollectArticleTakePage]
})
export class ManualCollectArticleTakePageModule {
}
