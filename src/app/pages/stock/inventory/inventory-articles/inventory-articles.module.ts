import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {InventoryArticlesPageRoutingModule} from './inventory-articles-routing.module';
import {InventoryArticlesPage} from './inventory-articles.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        InventoryArticlesPageRoutingModule,
        CommonModule
    ],
    declarations: [InventoryArticlesPage]
})
export class InventoryArticlesPageModule {
}
