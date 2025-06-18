import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {PickAndDropPageRoutingModule} from './pick-and-drop-routing.module';
import {PickAndDropPage} from './pick-and-drop.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        PickAndDropPageRoutingModule,
        CommonModule
    ],
    declarations: [PickAndDropPage]
})
export class PickAndDropPageModule {
}
