import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TransferValidatePageRoutingModule} from './transfer-validate-routing.module';
import {TransferValidatePage} from './transfer-validate.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TransferValidatePageRoutingModule,
        CommonModule
    ],
    declarations: [TransferValidatePage]
})
export class TransferValidatePageModule {
}
