import {Component, ViewChild} from '@angular/core';
import {ApiService} from '@app/services/api.service';
import {ToastService} from '@app/services/toast.service';
import {Observable, of, Subscription, zip} from 'rxjs';
import {filter, mergeMap, map, take, tap} from 'rxjs/operators';
import {StorageService} from '@app/services/storage/storage.service';
import {AppVersionService} from '@app/services/app-version.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {NavService} from '@app/services/nav/nav.service';
import {environment} from '@environments/environment';
import {credentials} from '@environments/credentials';
import {ServerImageKeyEnum} from '@app/services/server-image/server-image-key.enum';
import {ServerImageComponent} from '@common/components/server-image/server-image.component';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {UserService} from '@app/services/user.service';
import {NetworkService} from '@app/services/network.service';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";
import {BarcodeScannerManagerService} from "@app/services/barcode-scanner-manager.service";
import {NotificationService} from "@app/services/notification.service";
import {LocalNotificationSchema} from "@capacitor/local-notifications";
import {LoadingService} from "@app/services/loading.service";
import {MainHeaderService} from "@app/services/main-header.service";
import {StyleService} from "@app/services/style.service";


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

    public loading: boolean;
    public appVersionInvalid: boolean;
    public currentVersion: string;

    public apkUrl: string;

    public tappedNotification: LocalNotificationSchema;

    public loggedUser$: Observable<string|null>;
    public pendingDropTrackingMovements: boolean = false;

    private wantToAutoConnect: boolean;
    private zebraSubscription?: Subscription;
    private apiSubscription?: Subscription;
    private notificationSubscription?: Subscription;
    private loadingSubscription?: Subscription;

    public constructor(private toastService: ToastService,
                       private loadingService: LoadingService,
                       private apiService: ApiService,
                       private networkService: NetworkService,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private sqliteService: SqliteService,
                       private appVersionService: AppVersionService,
                       private storageService: StorageService,
                       private notificationService: NotificationService,
                       private navService: NavService,
                       private mainHeader: MainHeaderService,
                       private styleService: StyleService) {
        this.appVersionInvalid = false;
    }

    public ionViewWillEnter(): void {
        this.wantToAutoConnect = this.navService.param('autoConnect') ?? true;

        this.loading = true;

        this.notificationService.userIsLogged = false;
        this.loggedUser$ = this.storageService.getString(StorageKeyEnum.OPERATOR, UserService.MAX_PSEUDO_LENGTH);

        this.loadLastUserDrops();
        this.loadZebraScanUtilities();
        this.loadTappedNotification();

        if(this.serverImageLogo) {
            this.serverImageLogo.reload();
        }

        this.loadingSubscription = this.loadingService
            .presentLoadingWhile({
                event: () => this.loadApiData()
            })
            .subscribe({
                next: ({available, currentVersion, apkUrl}) => {
                    this.appVersionInvalid = !available;
                    this.currentVersion = currentVersion;
                    this.apkUrl = apkUrl;
                    this.loading = false;
                    setTimeout(() => {
                        this.autoLoginIfAllowed();
                    });
                },
                error: () => {
                    this.loading = false;
                    this.goToParams();
                }
            });
    }

    public ionViewWillLeave(): void {
        this.unsubscribeZebra();
        this.unsubscribeApi();
        this.unsubscribeNotification();
        if(this.loadingSubscription) {
            this.loadingSubscription.unsubscribe();
            this.loadingSubscription = undefined;
        }
    }

    public async logForm(): Promise<void> {
        if(!this.loading && this.loginKey) {
            const hasNetwork = await this.networkService.hasNetwork();
            if(hasNetwork) {
                this.loading = true;

                this.unsubscribeApi();

                this.apiSubscription = this.loadingService.presentLoadingWhile({
                    event: () => this.callApiLogin()
                })
                    .subscribe({
                        next: ({success, msg}) => {
                            this.loading = false;
                            if (success) {
                                this.notificationService.userIsLogged = true;
                                this.navService.setRoot(NavPathEnum.MAIN_MENU, {
                                    notification: this.tappedNotification
                                });
                            } else if (!success && msg) {
                                this.toastService.presentToast(msg);
                            } else {
                                this.toastService.presentToast('Identifiants incorrects.');
                            }
                        },
                        error: () => {
                            this.loading = false;
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
        if (!this.loading) {
            this.navService.push(NavPathEnum.PARAMS);
        }
    }

    public fillForm(key: string): void {
        this.loginKey = key;
        this.logForm();
    }

    private autoLoginIfAllowed() {
        if (!environment.production
            && credentials.autoConnect
            && credentials.loginKey
            && this.wantToAutoConnect) {
            this.fillForm(credentials.loginKey);
        }
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

    private get localDevServer(): string|undefined {
        return !environment.production
            ? `http://${window.location.hostname}`
            : undefined
    }

    private loadLastUserDrops(): void {
        this.storageService.getString(StorageKeyEnum.OPERATOR_ID).pipe(
            take(1),
            filter(Boolean),
            mergeMap((operator) => zip(
                this.apiService.requestApi(ApiService.GET_PREVIOUS_OPERATOR_MOVEMENTS, {params: {operator}}),
                this.sqliteService.findBy('mouvement_traca', [`type LIKE 'prise'`, `finished = 0`])
            ))
        ).subscribe(([apiData, localData]) => {
            this.pendingDropTrackingMovements = apiData.movements.length > 0 || localData.length > 0;
        });
    }

    private loadZebraScanUtilities(): void {
        this.barcodeScannerManager.launchDatawedgeScanListener();

        this.unsubscribeZebra();
        this.zebraSubscription = this.barcodeScannerManager.datawedgeScan$
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
    }

    private loadTappedNotification(): void {
        this.notificationSubscription = this.notificationService
            .notificationTapped$
            .subscribe((notification) => {
                this.tappedNotification = notification;
            });
    }

    private loadApiData() {
        return this.storageService.getString(StorageKeyEnum.URL_SERVER)
            .pipe(
                mergeMap((url) => zip(
                    of(url || this.localDevServer),
                    !url && this.localDevServer ? this.storageService.setItem(StorageKeyEnum.URL_SERVER, this.localDevServer) : of(undefined)
                )),
                tap(([url]) => {
                    if (!url) {
                        this.toastService.presentToast('Veuillez mettre à jour l\'url', {duration: ToastService.LONG_DURATION});
                        throw new Error('Empty api url');
                    }
                }),
                // we ping the api url + check if version available
                mergeMap(([url]) => {
                    return this.appVersionService.isAvailableVersion()
                        .pipe(
                            map((availableVersion) => ({
                                ...availableVersion,
                                apkUrl: `${url}/${LoginPage.PATH_DOWNLOAD_APK}`
                            })),
                            tap({
                                error: () => {
                                    this.toastService.presentToast('Erreur : la liaison avec le serveur est impossible', {duration: ToastService.LONG_DURATION});
                                    throw new Error('Invalid api url');
                                }
                            })
                        );
                })
            );
    }

    private callApiLogin(): Observable<{ success: boolean, msg?: string }> {
        return this.apiService
            .requestApi(ApiService.POST_API_KEY, {
                params: {loginKey: this.loginKey},
                secured: false,
                timeout: true
            })
            .pipe(
                mergeMap(({data, success, msg}) => {
                    if(success) {
                        const {apiKey, rights, userId, username, environment, notificationChannels, parameters, fieldsParam, dispatchDefaultWaybill} = data;

                        return this.sqliteService.resetDataBase()
                            .pipe(
                                mergeMap(() => this.storageService.initStorage(apiKey, username, userId, rights, notificationChannels, parameters, fieldsParam, dispatchDefaultWaybill)),
                                tap(() => {
                                    this.loginKey = '';
                                    this.mainHeader.emitEnvironment(environment);
                                    const color = environment === `rec` ? `#6433D7` : `#1B1464`;
                                    this.styleService.updatePrimaryColor(color);
                                    this.styleService.setStatusBarColor(true, color);
                                }),
                                mergeMap(() => this.notificationService.initialize()),
                                map(() => ({success: true, msg}))
                            )
                    }
                    else {
                        return of({success: false, msg})
                    }
                })
            )
    }
}
