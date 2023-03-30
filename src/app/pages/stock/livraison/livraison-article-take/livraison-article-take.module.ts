import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {LivraisonArticleTakePageRoutingModule} from './livraison-article-take-routing.module';
import {LivraisonArticleTakePage} from './livraison-article-take.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        LivraisonArticleTakePageRoutingModule,
        CommonModule
    ],
    declarations: [LivraisonArticleTakePage]
})
export class LivraisonArticleTakePageModule {
}
