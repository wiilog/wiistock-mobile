import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {ScanLocationsPageRoutingModule} from './scan-locations-routing.module';
import {ScanLocationsPage} from './scan-locations.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        ScanLocationsPageRoutingModule,
        CommonModule
    ],
    declarations: [ScanLocationsPage]
})
export class ScanLocationsModule {
}
