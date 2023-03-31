import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TransportCollectNaturesPageRoutingModule} from './transport-collect-natures-routing.module';
import {TransportCollectNaturesPage} from './transport-collect-natures.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TransportCollectNaturesPageRoutingModule,
        CommonModule
    ],
    declarations: [TransportCollectNaturesPage]
})
export class TransportCollectNaturesPageModule {
}
