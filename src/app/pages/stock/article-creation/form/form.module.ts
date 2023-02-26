import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {FormRoutingModule} from './form-routing.module';
import {FormPage} from './form.page';
import {CommonModule as NgCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        NgCommonModule,
        FormsModule,
        IonicModule,
        FormRoutingModule,
        CommonModule
    ],
    declarations: [FormPage]
})
export class FormModule {
}
