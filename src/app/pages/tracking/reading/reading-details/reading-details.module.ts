import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';
import {ReadingDetailsPage} from './reading-details.page';
import {ReadingDetailsRoutingModule} from './reading-details-routing.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        CommonModule,
        ReadingDetailsRoutingModule
    ],
    declarations: [ReadingDetailsPage]
})
export class ReadingDetailsModule {
}
