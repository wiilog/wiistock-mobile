import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TrackingMenuPageRoutingModule} from './tracking-menu-routing.module';
import {TrackingMenuPage} from './tracking-menu.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TrackingMenuPageRoutingModule,
        CommonModule
    ],
    declarations: [TrackingMenuPage]
})
export class TrackingMenuPageModule {
}
