import {ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {ApiService} from '@app/services/api.service';
import {ToastService} from '@app/services/toast.service';
import {Observable, of, Subscription, zip} from 'rxjs';
import {filter, mergeMap, map, take, tap} from 'rxjs/operators';
import {StorageService} from '@app/services/storage/storage.service';
import {AppVersionService} from '@app/services/app-version.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {NavService} from '@app/services/nav/nav.service';
import {ActivatedRoute, Router} from '@angular/router';
import {environment} from '@environments/environment';
// import {autoConnect, loginKey} from '../../dev-credentials.json'; // TODO WIIS-7970
import {ServerImageKeyEnum} from '@app/services/server-image/server-image-key.enum';
import {ServerImageComponent} from '@common/components/server-image/server-image.component';
// import {NotificationService} from '@app/common/services/notification.service'; // TODO WIIS-7970
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
// import {ILocalNotification} from '@ionic-native/local-notifications'; // TODO WIIS-7970
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {UserService} from '@app/services/user.service';
import {NetworkService} from '@app/services/network.service';
import {SplashScreen} from "@capacitor/splash-screen";
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";
import {BarcodeScannerManagerService} from "@app/services/barcode-scanner-manager.service";


@Component({
    selector: 'wii-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
})
export class LoginPage implements ViewWillEnter, ViewWillLeave {

    @ViewChild('serverImageLogo')
    public serverImageLogo: ServerImageComponent;

    private static readonly PATH_DOWNLOAD_APK: string = 'telecharger/nomade.apk';
    public readonly LOGIN_IMAGE_KEY: ServerImageKeyEnum = ServerImageKeyEnum.LOGIN_IMAGE_KEY;

    public loginKey: string;

    public _loading: boolean;
    public appVersionInvalid: boolean;
    public currentVersion: string;

    public apkUrl: string;

    // public tappedNotification: ILocalNotification; // TODO WIIS-7970

    public loggedUser$: Observable<string|null>;
    public pendingDeposits: boolean = false;

    private wantToAutoConnect: boolean;
    private appVersionSubscription?: Subscription;
    private urlServerSubscription?: Subscription;
    private zebraSubscription?: Subscription;
    private apiSubscription?: Subscription;
    private notificationSubscription?: Subscription;

    private passwordInputIsFocused: boolean;

    public constructor(private toastService: ToastService,
                       private apiService: ApiService,
                       private networkService: NetworkService,
                       private router: Router,

                       private changeDetector: ChangeDetectorRef,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private sqliteService: SqliteService,
                       private activatedRoute: ActivatedRoute,
                       private appVersionService: AppVersionService,
                       private storageService: StorageService,
                       // private notificationService: NotificationService, // TODO WIIS-7970
                       private navService: NavService) {
        this.loading = true;
        this.appVersionInvalid = false;
        this.passwordInputIsFocused = false;
    }

    public ionViewWillEnter(): void {
        this.storageService.getString(StorageKeyEnum.OPERATOR_ID).pipe(
            take(1),
            filter(Boolean),
            mergeMap((operator) => zip(
                this.apiService.requestApi(ApiService.GET_PREVIOUS_OPERATOR_MOVEMENTS, {params: {operator}}),
                this.sqliteService.findBy('mouvement_traca', [`type LIKE 'prise'`, `finished = 0`])
            ))
        ).subscribe(([apiData, localData]) => {
            this.pendingDeposits = apiData.movements.length > 0 || localData.length > 0;
        });

        if(this.serverImageLogo) {
            this.serverImageLogo.reload();
        }
        // const autoConnect = this.currentNavParams.get('autoConnect'); // TODO WIIS-7970
        // this.wantToAutoConnect = (typeof autoConnect === 'boolean' ? autoConnect : true); // TODO WIIS-7970

        this.barcodeScannerManager.registerZebraBroadcastReceiver();
        // this.notificationService.userIsLogged = false; // TODO WIIS-7970

        this.loggedUser$ = this.storageService.getString(StorageKeyEnum.OPERATOR, UserService.MAX_PSEUDO_LENGTH);

        this.unsubscribeZebra();
        this.zebraSubscription = this.barcodeScannerManager.zebraScan$
            .pipe(
                filter((barCode: string) => Boolean(
                    barCode
                    && barCode.length > 1
                    && !this.loading
                )),
                map((barCode: string) => {
                    const splitBarcode = barCode.split('\n');
                    return (splitBarcode && splitBarcode[0]) || '';
                })
            )
            .subscribe((barCode: string) => {
                this.fillForm(barCode);
            });

        this.urlServerSubscription = this.storageService.getString(StorageKeyEnum.URL_SERVER).subscribe((url) => {
            if(url) {
                this.appVersionSubscription = this.appVersionService.isAvailableVersion()
                    .pipe(
                        map((availableVersion) => ({
                            ...availableVersion,
                            apkUrl: `${url}/${LoginPage.PATH_DOWNLOAD_APK}`
                        }))
                    )
                    .subscribe({
                        next: ({available, currentVersion, apkUrl}) => {
                            this.appVersionInvalid = !available;
                            this.currentVersion = currentVersion;
                            this.apkUrl = apkUrl;
                            this.finishLoading();
                            setTimeout(() => {
                                this.autoLoginIfAllowed();
                            });
                        },
                        error: () => {
                            this.finishLoading();
                            this.toastService.presentToast('Erreur : la liaison avec le serveur est impossible', {duration: ToastService.LONG_DURATION});
                        }
                    });
            } else {
                this.toastService.presentToast('Veuillez mettre à jour l\'url', {duration: ToastService.LONG_DURATION});
                this.finishLoading();
                this.goToParams();
            }
        });

        /* TODO WIIS-7970
        this.notificationSubscription = this.notificationService
            .$localNotification
            .subscribe((notification) => {
                this.tappedNotification = notification;
            });
*/
    }

    public ionViewWillLeave(): void {
        this.unsubscribeZebra();
        this.unsubscribeApi();
        this.unsubscribeNotification();
        if(this.appVersionSubscription) {
            this.appVersionSubscription.unsubscribe();
            this.appVersionSubscription = undefined;
        }
        if(this.urlServerSubscription) {
            this.urlServerSubscription.unsubscribe();
            this.urlServerSubscription = undefined;
        }
    }

    public async logForm(): Promise<void> {
        if(!this.loading && this.loginKey) {
            const hasNetwork = await this.networkService.hasNetwork();
            if(hasNetwork) {
                this.loading = true;

                this.unsubscribeApi();

                this.apiSubscription = this.apiService
                    .requestApi(ApiService.POST_API_KEY, {
                        params: {loginKey: this.loginKey},
                        secured: false,
                        timeout: true
                    })
                    .pipe(
                        mergeMap(({data, success}) => {
                            if(success) {
                                const {apiKey, rights, userId, username, notificationChannels, parameters, fieldsParam} = data;

                                return this.sqliteService.resetDataBase()
                                    .pipe(
                                        mergeMap(() => this.storageService.initStorage(apiKey, username, userId, rights, notificationChannels, parameters, fieldsParam)),
                                        tap(() => {
                                            this.loginKey = '';
                                        }),
                                        /* TODO WIIS-7970
                                        mergeMap(() => this.notificationService.initialize()),
                                        mergeMap((notificationOptions) => {
                                            this.notificationService.userIsLogged = true;
                                            const {notification} = notificationOptions || {};
                                            return this.navService.setRoot(NavPathEnum.MAIN_MENU, {
                                                notification: this.tappedNotification || notification
                                            });
                                        }),
                                        */
                                        map(() => ({success: true}))
                                    )
                            } else {
                                return of({success: false})
                            }
                        })
                    )
                    .subscribe({
                        next: ({success}) => {
                            this.finishLoading();
                            if (!success) {
                                this.toastService.presentToast('Identifiants incorrects.');
                            }
                        },
                        error: () => {
                            this.finishLoading();
                            this.toastService.presentToast('Un problème est survenu, veuillez vérifier la connexion, vos identifiants et l\'URL saisie dans les paramètres', {duration: ToastService.LONG_DURATION});
                        }
                    });
            }
            else {
                this.toastService.presentToast('Vous devez être connecté à internet pour vous authentifier');
            }
        }
    }

    public goToParams(): void {
        if(!this.loading) {
            this.navService.push(NavPathEnum.PARAMS);
        }
    }

    public set loading(loading: boolean) {
        this._loading = loading;
        if(this._loading) {
            SplashScreen.show();
        } else {
            SplashScreen.hide();
        }
    }

    public get loading(): boolean {
        return this._loading;
    }

    public fillForm(key: string): void {
        this.loginKey = key;
        this.logForm();
    }

    private finishLoading() {
        this.loading = false;
        this.changeDetector.detectChanges();
    }

    private autoLoginIfAllowed() {
        /* TODO WIIS-7970
        if(!environment.production
            && autoConnect
            && this.wantToAutoConnect) {
            this.fillForm(loginKey);
        }
     */
    }

    private unsubscribeZebra(): void {
        if(this.zebraSubscription) {
            this.zebraSubscription.unsubscribe();
            this.zebraSubscription = undefined;
        }
    }

    private unsubscribeApi(): void {
        if(this.apiSubscription) {
            this.apiSubscription.unsubscribe();
            this.apiSubscription = undefined;
        }
    }

    private unsubscribeNotification(): void {
        if(this.notificationSubscription && !this.notificationSubscription.closed) {
            this.notificationSubscription.unsubscribe();
        }
        this.notificationSubscription = undefined;
    }
}
