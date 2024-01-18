import {Component} from '@angular/core';
import {Platform} from '@ionic/angular';
import {Observable} from 'rxjs';
import {NavService} from '@app/services/nav/nav.service';
import {map, mergeMap} from 'rxjs/operators';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {StorageService} from '@app/services/storage/storage.service';
import {ServerImageService} from '@app/services/server-image/server-image.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {LoadingService} from "@app/services/loading.service";
import {StyleService} from "@app/services/style.service";

@Component({
    selector: 'wii-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss']
})
export class AppComponent {

    public pageWithHeader: boolean;
    public platformReady: boolean;

    public constructor(private platform: Platform,
                       private loadingService: LoadingService,
                       private navService: NavService,
                       private sqliteService: SqliteService,
                       private storageService: StorageService,
                       private serverImageService: ServerImageService,
                       private styleService: StyleService) {
        this.platformReady = false;

        this.platform.ready().then(() => {
            this.loadingService
                .presentLoadingWhile({
                    event: () => this.initializeApp()
                })
                .subscribe(() => {
                    this.platformReady = true;
                    this.styleService.setStatusBarColor(this.pageWithHeader);
                });
        });
    }

    public onHeaderChange(withHeader: boolean): void {
        this.pageWithHeader = withHeader;
        if (this.platformReady) {
            this.styleService.setStatusBarColor(this.pageWithHeader);
        }
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
}
