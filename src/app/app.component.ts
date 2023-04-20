import {Component} from '@angular/core';
import {Platform} from '@ionic/angular';
import {ScssHelperService} from '@app/services/scss-helper.service';
import {Observable} from 'rxjs';
import {NavService} from '@app/services/nav/nav.service';
import {map, mergeMap, tap} from 'rxjs/operators';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {StorageService} from '@app/services/storage/storage.service';
import {ServerImageService} from '@app/services/server-image/server-image.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {StatusBar, Style} from "@capacitor/status-bar";
import {LoadingService} from "@app/services/loading.service";

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
                       private loadingService: LoadingService,
                       private navService: NavService,
                       private sqliteService: SqliteService,
                       private storageService: StorageService,
                       private scssHelper: ScssHelperService,
                       private serverImageService: ServerImageService) {
        this.platformReady = false;
        this.primaryColor = this.scssHelper.getVariable('ion-color-primary');
        this.darkColor = this.scssHelper.getVariable('ion-color-dark');

        this.platform.ready().then(() => {
            this.loadingService
                .presentLoadingWhile({
                    event: () => this.initializeApp()
                })
                .subscribe(() => {
                    this.platformReady = true;
                    StatusBar.setStyle({ style: Style.Dark });
                    this.setStatusBarColor();
                });
        });
    }

    public onHeaderChange(withHeader: boolean): void {
        this.pageWithHeader = withHeader;
        this.setStatusBarColor();
    }

    public initializeApp(): Observable<void> {
        return this.sqliteService.ensureDatabaseOpened()
            .pipe(
                mergeMap(() => this.sqliteService.resetDataBase()),
                mergeMap(() => this.serverImageService.loadFromStorage()),
                mergeMap(() => this.storageService.clearStorage([
                    StorageKeyEnum.URL_SERVER,
                    StorageKeyEnum.OPERATOR,
                    StorageKeyEnum.OPERATOR_ID,
                ])),
                mergeMap(() => this.serverImageService.saveToStorage()),
                mergeMap(() => this.navService.setRoot(NavPathEnum.LOGIN)),
                map(() => undefined)
            );
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
