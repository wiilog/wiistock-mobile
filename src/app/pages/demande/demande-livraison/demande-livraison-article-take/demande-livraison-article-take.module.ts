import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {DemandeLivraisonArticleTakePageRoutingModule} from './demande-livraison-article-take-routing.module';
import {DemandeLivraisonArticleTakePage} from './demande-livraison-article-take.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        DemandeLivraisonArticleTakePageRoutingModule,
        CommonModule
    ],
    declarations: [DemandeLivraisonArticleTakePage]
})
export class DemandeLivraisonArticleTakePageModule {
}
