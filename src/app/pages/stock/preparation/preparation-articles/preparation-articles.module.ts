import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {PreparationArticlesPageRoutingModule} from './preparation-articles-routing.module';
import {PreparationArticlesPage} from './preparation-articles.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        PreparationArticlesPageRoutingModule,
        CommonModule
    ],
    declarations: [PreparationArticlesPage]
})
export class PreparationArticlesPageModule {
}
