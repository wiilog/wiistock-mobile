import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';
import {HandlingValidatePageRoutingModule} from '@pages/demande/handling/handling-validate/handling-validate-routing.module';
import {HandlingValidatePage} from '@pages/demande/handling/handling-validate/handling-validate.page';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        HandlingValidatePageRoutingModule,
        CommonModule
    ],
    declarations: [HandlingValidatePage]
})
export class HandlingValidatePageModule {
}
