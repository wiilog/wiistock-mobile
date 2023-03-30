import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {CollecteArticlesPageRoutingModule} from './collecte-articles-routing.module';
import {CollecteArticlesPage} from './collecte-articles.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        CollecteArticlesPageRoutingModule,
        CommonModule
    ],
    declarations: [CollecteArticlesPage]
})
export class CollecteArticlesPageModule {
}
