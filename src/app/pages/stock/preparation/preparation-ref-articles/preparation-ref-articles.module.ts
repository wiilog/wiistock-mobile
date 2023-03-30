import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {PreparationRefArticlesPageRoutingModule} from './preparation-ref-articles-routing.module';
import {PreparationRefArticlesPage} from './preparation-ref-articles.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        PreparationRefArticlesPageRoutingModule,
        CommonModule
    ],
    declarations: [PreparationRefArticlesPage]
})
export class PreparationRefArticlesPageModule {
}
