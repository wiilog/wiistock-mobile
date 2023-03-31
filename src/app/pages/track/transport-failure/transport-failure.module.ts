import {NgModule} from '@angular/core';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TransportFailurePageRoutingModule} from './transport-failure-routing.module';
import {TransportFailurePage} from './transport-failure.page';

@NgModule({
    imports: [
        CommonModule,
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TransportFailurePageRoutingModule
    ],
    declarations: [TransportFailurePage]
})
export class TransportFailurePageModule {
}
