import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {ReceptionReferenceTakePageRoutingModule} from './reception-reference-take-routing.module';
import {ReceptionReferenceTakePage} from './reception-reference-take.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        ReceptionReferenceTakePageRoutingModule,
        CommonModule
    ],
    declarations: [ReceptionReferenceTakePage]
})
export class ReceptionReferenceTakePageModule {
}
