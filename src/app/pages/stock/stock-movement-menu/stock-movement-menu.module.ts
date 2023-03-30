import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {StockMovementMenuPageRoutingModule} from './stock-movement-menu-routing.module';
import {StockMovementMenuPage} from './stock-movement-menu.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        StockMovementMenuPageRoutingModule,
        CommonModule
    ],
    declarations: [StockMovementMenuPage]
})
export class StockMovementMenuPageModule {
}
