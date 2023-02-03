import {NgModule} from '@angular/core';
import {CommonModule as NgCommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {ParamsPageRoutingModule} from './params-routing.module';
import {ParamsPage} from './params.page';
import {CommonModule} from "@common/common.module";



@NgModule({
    imports: [
        NgCommonModule,
        CommonModule,
        FormsModule,
        IonicModule,
        ParamsPageRoutingModule,
    ],
    declarations: [ParamsPage]
})
export class ParamsPageModule {
}
