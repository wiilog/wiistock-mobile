import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {DispatchGroupedSignatureFinishPageRoutingModule} from './dispatch-grouped-signature-finish-routing.module';
import {DispatchGroupedSignatureFinishPage} from './dispatch-grouped-signature-finish.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        DispatchGroupedSignatureFinishPageRoutingModule,
        CommonModule
    ],
    declarations: [DispatchGroupedSignatureFinishPage]
})
export class DispatchGroupedSignatureFinishPageModule {
}
