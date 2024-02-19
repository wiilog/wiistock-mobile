import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {ManualCollectArticlesPageRoutingModule} from './manual-collect-articles-routing.module';
import {ManualCollectArticlesPage} from './manual-collect-articles.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        ManualCollectArticlesPageRoutingModule,
        CommonModule
    ],
    declarations: [ManualCollectArticlesPage]
})
export class ManualCollectArticlesPageModule {
}
