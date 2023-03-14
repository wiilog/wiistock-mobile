import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {AssociationRoutingModule} from './association-routing.module';
import {AssociationPage} from './association.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        AssociationRoutingModule,
        CommonModule
    ],
    declarations: [AssociationPage]
})
export class AssociationModule {
}
