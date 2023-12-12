import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {ReceiptAssociationMenuPageRoutingModule} from './receipt-association-menu-routing.module';
import {ReceiptAssociationMenuPage} from './receipt-association-menu.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        ReceiptAssociationMenuPageRoutingModule,
        CommonModule
    ],
    declarations: [ReceiptAssociationMenuPage]
})
export class ReceiptAssociationMenuPageModule {
}
