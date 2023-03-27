import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {DeposePageRoutingModule} from './depose-routing.module';
import {DeposePage} from './depose.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        DeposePageRoutingModule,
        CommonModule
    ],
    declarations: [DeposePage]
})
export class DeposePageModule {
}
