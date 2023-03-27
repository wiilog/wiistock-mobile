import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {DispatchValidatePageRoutingModule} from './dispatch-validate-routing.module';
import {DispatchValidatePage} from './dispatch-validate.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        DispatchValidatePageRoutingModule,
        CommonModule
    ],
    declarations: [DispatchValidatePage]
})
export class DispatchValidatePageModule {
}
