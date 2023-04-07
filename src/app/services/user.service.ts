import {Injectable} from '@angular/core';
import {zip} from 'rxjs';
import {StorageService} from '@app/services/storage/storage.service';
import {NavService} from "@app/services/nav/nav.service";
import {SqliteService} from "@app/services/sqlite/sqlite.service";
import {MainHeaderService} from '@app/services/main-header.service';
import {mergeMap} from 'rxjs/operators';
import {LoadingService} from '@app/services/loading.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {NotificationService} from "@app/services/notification.service";


@Injectable({
    providedIn: 'root'
})
export class UserService {

    public static readonly MAX_PSEUDO_LENGTH: number = 35;

    private logoutOnProgress: boolean;

    public constructor(private storageService: StorageService,
                       private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private notificationService: NotificationService,
                       private navService: NavService,
                       private mainHeaderService: MainHeaderService) {
        this.logoutOnProgress = false;
    }

    public doLogout(): void {
        if (!this.logoutOnProgress) {
            this.logoutOnProgress = true;
            zip(
                this.sqliteService.resetDataBase(),
                this.storageService.clearStorage([StorageKeyEnum.URL_SERVER]),
                this.notificationService.unsubscribe()
            )
                .pipe(
                    mergeMap(() => this.navService.setRoot(NavPathEnum.LOGIN, {autoConnect: false})),
                    mergeMap(() => this.loadingService.dismissLastLoading())
                )
                .subscribe(() => {
                    this.logoutOnProgress = false;
                    this.mainHeaderService.emitNavigationChange();
                });
        }
    }

}
