import {Component} from '@angular/core';
import {Platform} from '@ionic/angular';
import {ScssHelperService} from '@app/services/scss-helper.service';
import {from} from 'rxjs';
import {NavService} from '@app/services/nav/nav.service';
import {mergeMap, tap} from 'rxjs/operators';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {StorageService} from '@app/services/storage/storage.service';
import {ServerImageService} from '@app/services/server-image/server-image.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {StatusBar, Style} from "@capacitor/status-bar";
import {SplashScreen} from "@capacitor/splash-screen";

@Component({
    selector: 'wii-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss']
})
export class AppComponent {

    public pageWithHeader: boolean;
    public platformReady: boolean;

    private readonly primaryColor?: string;
    private readonly darkColor?: string;

    public constructor(private platform: Platform,
                       private navService: NavService,
                       private sqliteService: SqliteService,
                       private storageService: StorageService,
                       private scssHelper: ScssHelperService,
                       private serverImageService: ServerImageService) {
        this.platformReady = false;
        this.primaryColor = this.scssHelper.getVariable('ion-color-primary');
        this.darkColor = this.scssHelper.getVariable('ion-color-dark');
        this.initializeApp();
    }

    public onHeaderChange(withHeader: boolean): void {
        this.pageWithHeader = withHeader;
        this.setStatusBarColor();
    }

    public initializeApp(): void {
        SplashScreen.show();
        from(this.platform.ready())
            .pipe(
                mergeMap(() => this.sqliteService.ensureDatabaseOpened()),
                mergeMap(() => this.sqliteService.resetDataBase()),
                mergeMap(() => this.serverImageService.loadFromStorage()),
                mergeMap(() => this.storageService.clearStorage([
                    StorageKeyEnum.URL_SERVER,
                    StorageKeyEnum.OPERATOR,
                    StorageKeyEnum.OPERATOR_ID,
                ])),
                mergeMap(() => this.serverImageService.saveToStorage()),
                mergeMap(() => this.navService.setRoot(NavPathEnum.LOGIN)),
            )
            .subscribe(() => {
                this.platformReady = true;
                StatusBar.setStyle({ style: Style.Dark });
                this.setStatusBarColor();
            });
    }

    private setStatusBarColor(): void {
        if (this.platformReady) {
            const color = this.pageWithHeader ? this.primaryColor : this.darkColor;
            if (color) {
                StatusBar.setBackgroundColor({color});
            }
        }
    }
}
