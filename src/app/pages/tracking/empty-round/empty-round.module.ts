import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {EmptyRoundPageRoutingModule} from './empty-round-routing.module';
import {EmptyRoundPage} from './empty-round.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        CommonModule,
        EmptyRoundPageRoutingModule
    ],
    declarations: [EmptyRoundPage]
})
export class EmptyRoundPageModule {
}
