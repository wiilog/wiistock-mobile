import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {DemandeLivraisonArticlesPageRoutingModule} from './demande-livraison-articles-routing.module';
import {DemandeLivraisonArticlesPage} from './demande-livraison-articles.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        DemandeLivraisonArticlesPageRoutingModule,
        CommonModule
    ],
    declarations: [DemandeLivraisonArticlesPage]
})
export class DemandeLivraisonArticlesPageModule {
}
