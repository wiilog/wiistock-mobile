import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {ReceptionDetailsModule} from './reception-details-routing.module';
import {ReceptionDetailsPage} from './reception-details.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        ReceptionDetailsModule,
        CommonModule
    ],
    declarations: [ReceptionDetailsPage]
})
export class ReceptionDetailsPageModule {
}
