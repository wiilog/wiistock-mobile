import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TransferArticlesPage} from './transfer-articles.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';
import {TransferArticlesPageRoutingModule} from './transfer-articles-routing.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TransferArticlesPageRoutingModule,
        CommonModule
    ],
    declarations: [TransferArticlesPage]
})
export class TransferArticlesPageModule {
}
