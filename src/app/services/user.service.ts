import {Injectable} from '@angular/core';
import {zip} from 'rxjs';
import {StorageService} from '@app/services/storage/storage.service';
import {NavService} from "@app/services/nav/nav.service";
import {SqliteService} from "@app/services/sqlite/sqlite.service";
// import {MainHeaderService} from "@app/common/services/main-header.service"; // TODO adrien
import {mergeMap} from 'rxjs/operators';
import {LoadingService} from '@app/services/loading.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
// import {FCM} from 'cordova-plugin-fcm-with-dependecy-updated/ionic/ngx'; // TODO adrien


@Injectable()
export class UserService {

    public static readonly MAX_PSEUDO_LENGTH: number = 35;

    private logoutOnProgress: boolean;

    public constructor(private storageService: StorageService,
                       private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private navService: NavService,
                       // private fcm: FCM,  // TODO adrien
                       // private mainHeaderService: MainHeaderService  // TODO adrien
    ) {
        this.logoutOnProgress = false;
    }

    public doLogout(): void {
        if (!this.logoutOnProgress) {
            this.logoutOnProgress = true;
            zip(
                // this.sqliteService.resetDataBase(), // TODO adrien
                this.storageService.clearStorage([StorageKeyEnum.URL_SERVER]),
                // this.fcm.deleteInstanceId()
            )
                .pipe(
                    mergeMap(() => this.navService.setRoot(NavPathEnum.LOGIN, {autoConnect: false})),
                    mergeMap(() => this.loadingService.dismissLastLoading())
                )
                .subscribe(() => {
                    this.logoutOnProgress = false;
                    // this.mainHeaderService.emitNavigationChange(); // TODO adrien
                });
        }
    }

}
