import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {PrisePageRoutingModule} from './prise-routing.module';
import {PrisePage} from './prise.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        PrisePageRoutingModule,
        CommonModule
    ],
    declarations: [PrisePage]
})
export class PrisePageModule {
}
