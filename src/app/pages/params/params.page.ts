import {Component} from '@angular/core';
import {ApiService} from '@app/services/api.service';
import {LoadingService} from '@app/services/loading.service';
import {ToastService} from '@app/services/toast.service';
import {from, Subscription, throwError} from 'rxjs';
import {mergeMap} from 'rxjs/operators';
import {StorageService} from '@app/services/storage/storage.service';
import {NavService} from '@app/services/nav/nav.service';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {SqliteService} from "@app/services/sqlite/sqlite.service";
// import {localAddress} from '../../dev-credentials.json'; // TODO WIIS-7970
import {environment} from "@environments/environment";
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
// import {NotificationService} from '@app/services/notification.service'; // TODO WIIS-7970
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {NetworkService} from '@app/services/network.service';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";


@Component({
    selector: 'wii-params',
    templateUrl: './params.page.html',
    styleUrls: ['./params.page.scss'],
})
export class ParamsPage implements ViewWillEnter, ViewWillLeave {

    public URL: string;

    private serverUrlSubscription?: Subscription;
    private apiSubscription?: Subscription;

    public constructor(private storageService: StorageService,
                       private apiService: ApiService,
                       private loadingService: LoadingService,
                       private sqliteService: SqliteService,
                       private toastService: ToastService,
                       // private notificationService: NotificationService, // TODO WIIS-7970
                       private networkService: NetworkService,
                       private navService: NavService) {
        this.URL = '';
    }

    public ionViewWillEnter(): void {
        // this.notificationService.userIsLogged = false; // TODO WIIS-7970
        this.serverUrlSubscription = this.storageService.getString(StorageKeyEnum.URL_SERVER).subscribe((baseUrl) => {
            // TODO WIIS-7970
            // if(!environment.production && localAddress && !baseUrl) {
            //     this.URL = localAddress;
            //     this.registerURL();
            // } else {
                this.URL = !baseUrl ? '' : baseUrl;
            // }
        });
    }

    public ionViewWillLeave(): void {
        if (this.serverUrlSubscription) {
            this.serverUrlSubscription.unsubscribe();
            this.serverUrlSubscription = undefined;
        }
        if (this.apiSubscription) {
            this.apiSubscription.unsubscribe();
            this.apiSubscription = undefined;
        }
    }

    public async registerURL(): Promise<void> {
        const hasNetwork = await this.networkService.hasNetwork();
        if (hasNetwork) {
            this.apiSubscription = this.loadingService.presentLoadingWhile({
                message: 'V??rification de l\'URL...',
                event: () => this.apiService.getApiUrl(ApiService.GET_PING, {newUrl: this.URL})
                    .pipe(
                        mergeMap((pingURL: string|null) => (
                            pingURL
                                ? this.apiService.pingApi(pingURL)
                                : throwError(() => new Error('invalid-url'))
                        )),
                        mergeMap(() => this.storageService.setItem(StorageKeyEnum.URL_SERVER, this.URL)),
                        mergeMap(() => this.sqliteService.resetDataBase(true)),
                        mergeMap(() => this.toastService.presentToast('URL enregistr??e'))
                    )
            })
                .subscribe({
                    next: () => {
                        this.navService.setRoot(NavPathEnum.LOGIN);
                    },
                    error: () => {
                        this.toastService.presentToast('URL invalide');
                    }
                });

        }
        else {
            this.toastService.presentToast('Serveur inaccessible, v??rifier votre connexion ou l???URL saisie.');
        }
    }
}
