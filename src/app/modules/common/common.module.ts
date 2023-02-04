import {NgModule} from '@angular/core';
import {CommonModule as NgCommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {HttpClientModule} from '@angular/common/http';
import {IconComponent} from "@common/components/icon/icon.component";
import {MainLoaderComponent} from "@common/components/main-loader/main-loader.component";
import {ServerImageComponent} from "@common/components/server-image/server-image.component";
import {MainHeaderComponent} from "@common/components/main-header/main-header.component";
import {MenuComponent} from "@common/components/menu/menu.component";

@NgModule({
    imports: [
        NgCommonModule,
        HttpClientModule,
        IonicModule,
        FormsModule,
    ],
    declarations: [
        IconComponent,
        MainLoaderComponent,
        MainHeaderComponent,
        ServerImageComponent,
        MenuComponent,
    ],
    exports: [
        IconComponent,
        MainLoaderComponent,
        ServerImageComponent,
        MainHeaderComponent,
        MenuComponent,
    ]
})
export class CommonModule {
}
