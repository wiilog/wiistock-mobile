import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {CollecteMenuPageRoutingModule} from './collecte-menu-routing.module';
import {CollecteMenuPage} from './collecte-menu.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        CollecteMenuPageRoutingModule,
        CommonModule
    ],
    declarations: [CollecteMenuPage]
})
export class CollecteMenuPageModule {
}
