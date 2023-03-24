import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {DispatchNewRoutingModule} from './dispatch-new-routing.module';
import {DispatchNewPage} from './dispatch-new.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        DispatchNewRoutingModule,
        CommonModule
    ],
    declarations: [DispatchNewPage]
})
export class DispatchNewModule {
}
