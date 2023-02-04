import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {ArticleCreationRoutingModule} from './article-creation-routing.module';
import {ArticleCreationPage} from './article-creation.page';
import {CommonModule as NgCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        NgCommonModule,
        FormsModule,
        IonicModule,
        ArticleCreationRoutingModule,
        CommonModule
    ],
    declarations: [ArticleCreationPage]
})
export class ArticleCreationModule {
}
