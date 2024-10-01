import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';
import {ReadingScanPage} from './reading-scan.page';
import {ReadingScanRoutingModule} from './reading-scan-routing.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        CommonModule,
        ReadingScanRoutingModule
    ],
    declarations: [ReadingScanPage]
})
export class ReadingScanModule {
}
