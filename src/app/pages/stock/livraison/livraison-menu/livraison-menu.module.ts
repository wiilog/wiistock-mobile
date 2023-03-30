import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {LivraisonMenuPageRoutingModule} from './livraison-menu-routing.module';
import {LivraisonMenuPage} from './livraison-menu.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        LivraisonMenuPageRoutingModule,
        CommonModule
    ],
    declarations: [LivraisonMenuPage]
})
export class LivraisonMenuPageModule {
}
