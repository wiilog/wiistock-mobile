import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {LivraisonEmplacementPageRoutingModule} from './livraison-emplacement-routing.module';
import {LivraisonEmplacementPage} from './livraison-emplacement.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        LivraisonEmplacementPageRoutingModule,
        CommonModule
    ],
    declarations: [LivraisonEmplacementPage]
})
export class LivraisonEmplacementPageModule {
}
