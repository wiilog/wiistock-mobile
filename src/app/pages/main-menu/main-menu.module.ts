import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {MainMenuPage} from './main-menu.page';
import {CommonModule as NgCommonModule} from '@angular/common';
import {MainMenuPageRoutingModule} from './main-menu-routing.module';
import {CommonModule} from '@common/common.module';

@NgModule({
    imports: [
        NgCommonModule,
        FormsModule,
        IonicModule,
        MainMenuPageRoutingModule,
        CommonModule
    ],
    declarations: [MainMenuPage]
})
export class MainMenuPageModule {
}
