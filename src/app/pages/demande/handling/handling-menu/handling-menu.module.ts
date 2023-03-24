import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {HandlingMenuPageRoutingModule} from './handling-menu-routing.module';
import {HandlingMenuPage} from './handling-menu.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        HandlingMenuPageRoutingModule,
        CommonModule
    ],
    declarations: [HandlingMenuPage]
})
export class HandlingMenuPageModule {
}
