import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TrackingMovementMenuPage} from './tracking-movement-menu.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';
import {TrackingMovementMenuPageRoutingModule} from './tracking-movement-menu-routing.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TrackingMovementMenuPageRoutingModule,
        CommonModule
    ],
    declarations: [TrackingMovementMenuPage]
})
export class TrackingMovementMenuPageModule {
}
