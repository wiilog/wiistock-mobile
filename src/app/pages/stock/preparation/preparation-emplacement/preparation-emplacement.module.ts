import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {PreparationEmplacementPageRoutingModule} from './preparation-emplacement-routing.module';
import {PreparationEmplacementPage} from './preparation-emplacement.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        PreparationEmplacementPageRoutingModule,
        CommonModule
    ],
    declarations: [PreparationEmplacementPage]
})
export class PreparationEmplacementPageModule {
}
