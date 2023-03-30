import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {CollecteArticlePickingPageRoutingModule} from './collecte-article-picking-routing.module';
import {CollecteArticlePickingPage} from './collecte-article-picking.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        CollecteArticlePickingPageRoutingModule,
        CommonModule
    ],
    declarations: [CollecteArticlePickingPage]
})
export class CollecteArticlePickingPageModule {
}
