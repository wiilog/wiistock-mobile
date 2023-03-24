import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {DemandeLivraisonHeaderPageRoutingModule} from './demande-livraison-header-routing.module';
import {DemandeLivraisonHeaderPage} from './demande-livraison-header.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        DemandeLivraisonHeaderPageRoutingModule,
        CommonModule
    ],
    declarations: [DemandeLivraisonHeaderPage]
})
export class DemandeLivraisonHeaderPageModule {
}
