import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {MovementConfirmPageRoutingModule} from './movement-confirm-routing.module';
import {MovementConfirmPage} from './movement-confirm.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        MovementConfirmPageRoutingModule,
        CommonModule
    ],
    declarations: [MovementConfirmPage]
})
export class MovementConfirmPageModule {
}
