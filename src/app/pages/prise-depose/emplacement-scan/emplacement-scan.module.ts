import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {EmplacementScanPageRoutingModule} from './emplacement-scan-routing.module';
import {EmplacementScanPage} from './emplacement-scan.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        EmplacementScanPageRoutingModule,
        CommonModule
    ],
    declarations: [EmplacementScanPage]
})
export class EmplacementScanPageModule {
}
