import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {NewEmplacementPageRoutingModule} from './new-emplacement-routing.module';
import {NewEmplacementPage} from './new-emplacement.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        NewEmplacementPageRoutingModule,
        CommonModule
    ],
    declarations: [NewEmplacementPage]
})
export class NewEmplacementPageModule {
}
