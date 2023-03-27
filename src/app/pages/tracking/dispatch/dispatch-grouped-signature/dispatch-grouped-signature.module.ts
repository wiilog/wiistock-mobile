import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {DispatchGroupedSignaturePageRoutingModule} from './dispatch-grouped-signature-routing.module';
import {DispatchGroupedSignaturePage} from './dispatch-grouped-signature.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        DispatchGroupedSignaturePageRoutingModule,
        CommonModule
    ],
    declarations: [DispatchGroupedSignaturePage]
})
export class DispatchGroupedSignaturePageModule {
}
