import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {DispatchPacksPageRoutingModule} from './dispatch-packs-routing.module';
import {DispatchPacksPage} from './dispatch-packs.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        DispatchPacksPageRoutingModule,
        CommonModule
    ],
    declarations: [DispatchPacksPage]
})
export class DispatchPacksPageModule {
}
