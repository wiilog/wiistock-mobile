import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {StockMenuPageRoutingModule} from './stock-menu-routing.module';
import {StockMenuPage} from './stock-menu.page';
import {CommonModule as NgCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        NgCommonModule,
        FormsModule,
        IonicModule,
        StockMenuPageRoutingModule,
        CommonModule
    ],
    declarations: [StockMenuPage]
})
export class StockMenuPageModule {
}
