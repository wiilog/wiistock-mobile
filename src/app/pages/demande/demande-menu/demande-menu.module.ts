import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {DemandeMenuPageRoutingModule} from './demande-menu-routing.module';
import {DemandeMenuPage} from './demande-menu.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        DemandeMenuPageRoutingModule,
        CommonModule
    ],
    declarations: [DemandeMenuPage]
})
export class DemandeMenuPageModule {
}
