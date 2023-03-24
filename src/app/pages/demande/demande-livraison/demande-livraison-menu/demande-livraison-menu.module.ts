import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {DemandeLivraisonMenuPageRoutingModule} from './demande-livraison-menu-routing.module';
import {DemandeLivraisonMenuPage} from './demande-livraison-menu.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        DemandeLivraisonMenuPageRoutingModule,
        CommonModule
    ],
    declarations: [DemandeLivraisonMenuPage]
})
export class DemandeLivraisonMenuPageModule {
}
