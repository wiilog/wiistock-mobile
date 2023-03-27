import {NgModule} from '@angular/core';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {GroupContentPageRoutingModule} from './group-content-routing.module';

import {GroupContentPage} from './group-content.page';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        CommonModule,
        AngularCommonModule,
        FormsModule,
        IonicModule,
        GroupContentPageRoutingModule
    ],
    declarations: [GroupContentPage]
})
export class GroupContentPageModule {
}
