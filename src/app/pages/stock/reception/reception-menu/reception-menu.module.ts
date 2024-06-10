import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {ReceptionMenuPageRoutingModule} from './reception-menu-routing.module';
import {ReceptionMenuPage} from './reception-menu.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        ReceptionMenuPageRoutingModule,
        CommonModule
    ],
    declarations: [ReceptionMenuPage]
})
export class PreparationMenuPageModule {
}
