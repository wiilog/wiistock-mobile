import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {DispatchGroupedSignatureValidateRoutingModule} from './dispatch-grouped-signature-validate-routing.module';
import {DispatchGroupedSignatureValidatePage} from './dispatch-grouped-signature-validate.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        DispatchGroupedSignatureValidateRoutingModule,
        CommonModule
    ],
    declarations: [DispatchGroupedSignatureValidatePage]
})
export class DispatchGroupedSignatureValidatePageModule {
}
