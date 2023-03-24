import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {DispatchRequestMenuRoutingModule} from './dispatch-request-menu-routing.module';
import {DispatchRequestMenuPage} from './dispatch-request-menu.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        DispatchRequestMenuRoutingModule,
        CommonModule
    ],
    declarations: [DispatchRequestMenuPage]
})
export class DispatchRequestMenuModule {
}
