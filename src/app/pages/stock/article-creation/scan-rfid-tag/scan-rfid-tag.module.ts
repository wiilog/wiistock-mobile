import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {ScanRfidTagRoutingModule} from './scan-rfid-tag-routing.module';
import {ScanRfidTagPage} from './scan-rfid-tag.page';
import {CommonModule as NgCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        NgCommonModule,
        FormsModule,
        IonicModule,
        ScanRfidTagRoutingModule,
        CommonModule
    ],
    declarations: [ScanRfidTagPage]
})
export class ScanRfidTagModule {
}
