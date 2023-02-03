import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouteReuseStrategy} from '@angular/router';

import {IonicModule, IonicRouteStrategy} from '@ionic/angular';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {UserService} from "@app/services/user.service";
import {ToastService} from "@app/services/toast.service";
import {NetworkService} from "@app/services/network.service";
import {LoadingService} from "@app/services/loading.service";
import {ApiService} from "@app/services/api.service";
import {StorageService} from "@app/services/storage/storage.service";
import {SqliteService} from "@app/services/sqlite/sqlite.service";
import {NavService} from "@app/services/nav/nav.service";
import {AppVersionService} from "@app/services/app-version.service";
import {ServerImageService} from "@app/services/server-image/server-image.service";
import {HttpClientModule} from "@angular/common/http";
import {ScssHelperService} from "@app/services/scss-helper.service";
import {MainHeaderService} from "@app/services/main-header.service";
import {AlertService} from "@app/services/alert.service";
import {TranslationService} from "@app/services/translations.service";
import {CommonModule} from "@common/common.module";

@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        BrowserModule,
        IonicModule.forRoot(),
        AppRoutingModule,
        HttpClientModule,
        CommonModule,
    ],
    providers: [
        {provide: RouteReuseStrategy, useClass: IonicRouteStrategy},
        UserService,
        ToastService,
        NetworkService,
        LoadingService,
        ApiService,
        StorageService,
        SqliteService,
        NavService,
        AppVersionService,
        ServerImageService,
        ScssHelperService,
        MainHeaderService,
        AlertService,
        TranslationService,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {
}
