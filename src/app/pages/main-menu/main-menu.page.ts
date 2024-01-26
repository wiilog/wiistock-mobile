import {ChangeDetectorRef, Component, NgZone} from '@angular/core';
import {MenuConfig} from '@common/components/menu/menu-config';
import {Observable, Subject, Subscription, zip} from 'rxjs';
import {map, mergeMap} from 'rxjs/operators';
import {Platform, ViewWillEnter, ViewWillLeave} from '@ionic/angular';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {StorageService} from '@app/services/storage/storage.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {ToastService} from '@app/services/toast.service';
import {NavService} from '@app/services/nav/nav.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {App} from '@capacitor/app';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {AlertService} from '@app/services/alert.service';
import {NetworkService} from '@app/services/network.service';
import {ApiService} from '@app/services/api.service';
import {PluginListenerHandle} from "@capacitor/core/types/definitions";
import {NotificationService} from "@app/services/notification.service";
import {LocalNotificationSchema} from "@capacitor/local-notifications";
import {LoadingService} from "@app/services/loading.service";


@Component({
    selector: 'wii-main-menu',
    templateUrl: './main-menu.page.html',
    styleUrls: ['./main-menu.page.scss'],
})
export class MainMenuPage implements ViewWillEnter, ViewWillLeave {
    public loading: boolean;
    public displayNotifications: boolean;

    public menuConfig: Array<MenuConfig>;

    public messageLoading?: string;

    private exitAlert?: HTMLIonAlertElement;

    private backButtonListenerHandle?: PluginListenerHandle;
    private synchronisationSubscription?: Subscription;
    private synchroniseActionSubscription?: Subscription;
    private notificationSubscription?: Subscription;

    private pageIsRedirecting: boolean;
    private lastNotificationRedirected: LocalNotificationSchema;
    private isDispatchOfflineMode: boolean = false;
    private dispatchOfflineModeToastAlreadyPresented: boolean = false

    public constructor(private alertService: AlertService,
                       private apiService: ApiService,
                       private sqliteService: SqliteService,
                       private storageService: StorageService,
                       private localDataManager: LocalDataManagerService,
                       private toastService: ToastService,
                       private networkService: NetworkService,
                       private changeDetector: ChangeDetectorRef,
                       private ngZone: NgZone,
                       private notificationService: NotificationService,
                       private navService: NavService,
                       private loadingService: LoadingService) {
        this.loading = true;
        this.displayNotifications = false;
        this.pageIsRedirecting = false;
    }

    public ionViewWillEnter(): void {
        const notification = this.navService.param<LocalNotificationSchema>('notification');

        zip(
            this.synchronise(),
            this.storageService.getRight(StorageKeyEnum.DISPATCH_OFFLINE_MODE)
        ).subscribe(([synchronise, isDispatchOfflineMode]) => {
            this.isDispatchOfflineMode = isDispatchOfflineMode;
            if (notification && this.lastNotificationRedirected !== notification) {
                this.doNotificationRedirection(notification);
            }

            if(this.isDispatchOfflineMode && !this.dispatchOfflineModeToastAlreadyPresented) {
                this.dispatchOfflineModeToastAlreadyPresented = true;
                this.toastService.presentToast(`Vous êtes en mode hors-ligne sur les acheminements, veillez à bien synchroniser vos données.`);
            }
        });

        this.backButtonListenerHandle = App.addListener('backButton', () => {
            this.onBackButton();
        });

        this.notificationSubscription = this.notificationService.notificationTapped$.subscribe((notification) => {
            this.doSynchronisationAndNotificationRedirection(notification);
        });
    }

    public async ionViewWillLeave() {
        if (this.backButtonListenerHandle) {
            await this.backButtonListenerHandle.remove();
            this.backButtonListenerHandle = undefined;
        }
        if (this.synchronisationSubscription) {
            this.synchronisationSubscription.unsubscribe();
            this.synchronisationSubscription = undefined;
        }
        this.unsubscribeNotification();
    }

    public synchronise(): Observable<void> {
        const $res = new Subject<void>();

        this.networkService.hasNetwork().then((hasNetwork) => {
            if (hasNetwork) {
                this.loading = true;
                this.changeDetector.detectChanges();

                this.synchronisationSubscription = this.localDataManager.synchroniseData()
                    .pipe(
                        mergeMap(({finished, message}) => (
                            zip(
                                this.storageService.getRight(StorageKeyEnum.RIGHT_TRACK),
                                this.displayGlobalMenu([
                                    this.storageService.getRight(StorageKeyEnum.RIGHT_CREATE_ARTICLE_FROM_NOMADE),
                                    this.storageService.getRight(StorageKeyEnum.RIGHT_PREPARATION),
                                    this.storageService.getRight(StorageKeyEnum.RIGHT_DELIVERY_ORDER),
                                    this.storageService.getRight(StorageKeyEnum.RIGHT_MANUAL_DELIVERY),
                                    this.storageService.getRight(StorageKeyEnum.RIGHT_COLLECT_ORDER),
                                    this.storageService.getRight(StorageKeyEnum.RIGHT_TRANSFER_ORDER),
                                    this.storageService.getRight(StorageKeyEnum.RIGHT_MANUAL_TRANSFER),
                                    this.storageService.getRight(StorageKeyEnum.RIGHT_INVENTORY),
                                    this.storageService.getRight(StorageKeyEnum.RIGHT_ARTICLE_UL_ASSOCIATION)
                                ]),
                                this.displayGlobalMenu([
                                    this.storageService.getRight(StorageKeyEnum.DISPATCH_OFFLINE_MODE),
                                    this.storageService.getRight(StorageKeyEnum.RIGHT_HANDLING),
                                    this.storageService.getRight(StorageKeyEnum.RIGHT_DELIVERY_REQUEST),
                                ]),
                                this.displayGlobalMenu([
                                    this.storageService.getRight(StorageKeyEnum.TRUCK_ARRIVAL),
                                    this.storageService.getRight(StorageKeyEnum.RIGHT_GROUP),
                                    this.storageService.getRight(StorageKeyEnum.RIGHT_UNGROUP),
                                    this.storageService.getRight(StorageKeyEnum.RIGHT_MOVEMENT),
                                    this.storageService.getRight(StorageKeyEnum.RIGHT_DISPATCH),
                                    this.storageService.getRight(StorageKeyEnum.RIGHT_RECEIPT_ASSOCIATION),
                                ]),
                            ).pipe(map(([track, stock, request, tracing]) => ({
                                finished,
                                message,
                                rights: {track, stock, request, tracing}
                            })))
                        ))
                    )
                    .subscribe({
                        next: ({finished, message, rights}) => {
                            this.messageLoading = message;
                            if (finished) {
                                this.displayNotifications = Boolean(rights.stock);
                                this.resetMainMenuConfig(rights);
                                this.loading = false;
                                $res.next();
                                $res.complete();
                            } else {
                                this.loading = true;
                            }
                        },
                        error: (error) => {
                            this.loading = false;
                            const {api, message} = error;
                            if (api && message) {
                                this.toastService.presentToast(message);
                            }
                            $res.complete();
                            throw error;
                        }
                    });
            }
            else {
                this.loading = false;
                this.toastService.presentToast('Veuillez vous connecter à internet afin de synchroniser vos données');
                $res.complete();
            }
        });

        return $res;
    }

    private async onBackButton() {
        if (this.exitAlert) {
            this.exitAlert.dismiss();
            this.exitAlert = undefined;
        }
        else {
            if(this.isDispatchOfflineMode) {
                await this.alertService.show({
                    header: `Vous êtes en mode hors-ligne sur les acheminements. Vos données seront perdues si elles ne sont pas synchronisées.`,
                    backdropDismiss: false,
                    buttons: [
                        {
                            text: 'Annuler',
                            role: 'cancel',
                            handler: () => {
                                this.exitAlert = undefined;
                            }
                        },
                        {
                            text: 'Confirmer',
                            handler: () => this.registerExitAlert(),
                            cssClass: 'alert-success'
                        }
                    ]
                });
            } else {
                await this.registerExitAlert();
            }
        }
    }

    private async registerExitAlert() {
        this.exitAlert = await this.alertService.show({
            header: `Êtes-vous sûr de vouloir quitter l'application ?`,
            backdropDismiss: false,
            buttons: [
                {
                    text: 'Annuler',
                    role: 'cancel',
                    handler: () => {
                        this.exitAlert = undefined;
                    }
                },
                {
                    text: 'Confirmer',
                    handler: () => {
                        this.loadingService.presentLoadingWhile({
                            event: () => this.apiService.requestApi(ApiService.LOGOUT),
                        }).subscribe(() => App.exitApp());
                    },
                    cssClass: 'alert-success'
                }
            ]
        });
    }

    private resetMainMenuConfig(rights: {track?: boolean, stock?: boolean, request?: boolean, tracing?: boolean}) {
        this.menuConfig = [];

        const actions = [];

        if(rights.tracing){
            const actionTracking = () => {
                this.navService.push(NavPathEnum.TRACKING_MENU, {
                    fromStock: false
                });
            }
            this.menuConfig.push({
                icon: 'tracking.svg',
                label: 'Traçabilité',
                action: actionTracking,
            });
            actions.push(actionTracking);
        }

        if(rights.stock){
            const actionStock = () => {
                this.navService.push(NavPathEnum.STOCK_MENU, {avoidSync: true});
            }
            this.menuConfig.push({
                icon: 'stock.svg',
                label: 'Stock',
                action: actionStock,
            });
            actions.push(actionStock);
        }

        if(rights.request){
            const actionDemande = () => {
                this.navService.push(NavPathEnum.DEMANDE_MENU);
            };
            this.menuConfig.push({
                icon: 'demande.svg',
                iconColor: 'success',
                label: 'Demande',
                action: actionDemande,
            });
            actions.push(actionDemande);
        }

        if (rights.track) {
            const action = () => {
                this.navService.push(NavPathEnum.TRANSPORT_ROUND_LIST);
            };
            this.menuConfig.push({
                icon: 'track.svg',
                label: 'Track',
                action
            });
            actions.push(action);
        }

        if (actions.length === 1) {
            actions[0]();
        }
    }

    private doSynchronisationAndNotificationRedirection(notification: LocalNotificationSchema): void {
        if(notification && !this.synchroniseActionSubscription) {
            this.synchroniseActionSubscription = this.synchronise()
                .subscribe({
                    next: () => {
                        this.doNotificationRedirection(notification);
                        this.unsubscribeSynchroniseAction();
                    },
                    error: () => {
                        this.unsubscribeSynchroniseAction();
                    },
                    complete: () => {
                        this.unsubscribeSynchroniseAction();
                    }
                });
        }
    }

    private doNotificationRedirection(notification: LocalNotificationSchema) {
        if (!this.pageIsRedirecting && notification) {
            this.lastNotificationRedirected = notification;
            this.ngZone.run(() => {
                const {extra} = notification;
                if(extra.type === 'transport') {
                    this.apiService.requestApi(ApiService.FETCH_ROUND, {
                        params: {request: extra.id},
                    }).subscribe(round => {
                        this.navService
                            .push(NavPathEnum.TRANSPORT_ROUND_LIST)
                            .pipe(mergeMap(() => this.navService.push(NavPathEnum.TRANSPORT_LIST, {
                                round,
                                cancelledTransport: extra.id,
                            })))
                            .subscribe(() => {
                                this.pageIsRedirecting = false;
                            });
                    });
                }
                else if (extra.type === 'round') {
                    this.navService.push(NavPathEnum.TRANSPORT_ROUND_LIST).subscribe(() => {
                        this.pageIsRedirecting = false;
                    });
                }
                else if (extra.type === 'dispatch') {
                    this.pageIsRedirecting = true;
                    const dispatchId = Number(extra.id);
                    this.storageService.getRight(StorageKeyEnum.FORCE_GROUPED_SIGNATURE).subscribe((forceSignature) => {
                        if (forceSignature) {
                            this.navService.push(NavPathEnum.DISPATCH_GROUPED_SIGNATURE).subscribe(() => {
                                this.pageIsRedirecting = false;
                            })
                        } else {
                            this.navService
                                .push(NavPathEnum.TRACKING_MENU)
                                .pipe(
                                    mergeMap(() => this.navService.push(NavPathEnum.DISPATCH_MENU, {withoutLoading: true})),
                                    mergeMap(() => this.navService.push(NavPathEnum.DISPATCH_PACKS, {
                                        dispatchId
                                    }))
                                )
                                .subscribe(() => {
                                    this.pageIsRedirecting = false;
                                });
                        }
                    })
                }
                else if (extra.type === 'service') {
                    this.pageIsRedirecting = true;
                    const handlingId = Number(extra.id);
                    this.sqliteService.findOneBy('handling', {id: handlingId}).subscribe((handling) => {
                        if (handling) {
                            this.navService
                                .push(NavPathEnum.DEMANDE_MENU)
                                .pipe(
                                    mergeMap(() => this.navService.push(NavPathEnum.HANDLING_MENU, {withoutLoading: true})),
                                    mergeMap(() => this.navService.push(NavPathEnum.HANDLING_VALIDATE, {handling}))
                                )
                                .subscribe(() => {
                                    this.pageIsRedirecting = false;
                                });
                        }
                        else {
                            this.pageIsRedirecting = false;
                        }
                    })
                }
                else if (extra.type === 'transfer') {
                    this.pageIsRedirecting = true;
                    const transferId = Number(extra.id);
                    this.sqliteService.findOneBy('transfer_order', {id: transferId}).subscribe((transferOrder) => {
                        if (transferOrder) {
                            this.navService
                                .push(NavPathEnum.STOCK_MENU)
                                .pipe(
                                    mergeMap(() => this.navService.push(NavPathEnum.TRANSFER_LIST, {withoutLoading: true})),
                                    mergeMap(() => this.navService.push(NavPathEnum.TRANSFER_ARTICLES, {transferOrder}))
                                )
                                .subscribe(() => {
                                    this.pageIsRedirecting = false;
                                });
                        }
                        else {
                            this.pageIsRedirecting = false;
                        }
                    })
                }
                else if (extra.type === 'preparation') {
                    this.pageIsRedirecting = true;
                    const preparationId = Number(extra.id);
                    this.sqliteService.findOneBy('preparation', {id: preparationId}).subscribe((preparation) => {
                        if (preparation) {
                            this.navService
                                .push(NavPathEnum.STOCK_MENU)
                                .pipe(
                                    mergeMap(() => this.navService.push(NavPathEnum.PREPARATION_MENU, {withoutLoading: true})),
                                    mergeMap(() => this.navService.push(NavPathEnum.PREPARATION_ARTICLES, {preparation}))
                                )
                                .subscribe(() => {
                                    this.pageIsRedirecting = false;
                                });
                        }
                        else {
                            this.pageIsRedirecting = false;
                        }
                    })
                }
                else if (extra.type === 'delivery') {
                    this.pageIsRedirecting = true;
                    const deliveryId = Number(extra.id);
                    this.sqliteService.findOneBy('livraison', {id: deliveryId}).subscribe((delivery) => {
                        if (delivery) {
                            this.navService
                                .push(NavPathEnum.STOCK_MENU)
                                .pipe(
                                    mergeMap(() => this.navService.push(NavPathEnum.LIVRAISON_MENU, {withoutLoading: true})),
                                    mergeMap(() => this.navService.push(NavPathEnum.LIVRAISON_ARTICLES, {livraison: delivery}))
                                )
                                .subscribe(() => {
                                    this.pageIsRedirecting = false;
                                });
                        }
                        else {
                            this.pageIsRedirecting = false;
                        }
                    })
                }
                else if (extra.type === 'collect') {
                    this.pageIsRedirecting = true;
                    const collectId = Number(extra.id);
                    this.sqliteService.findOneBy('collecte', {id: collectId}).subscribe((collect) => {
                        if (collect) {
                            this.navService
                                .push(NavPathEnum.STOCK_MENU)
                                .pipe(
                                    mergeMap(() => this.navService.push(NavPathEnum.COLLECTE_MENU, {withoutLoading: true})),
                                    mergeMap(() => this.navService.push(NavPathEnum.COLLECTE_ARTICLES, {
                                        collecte: collect,
                                        goToDrop: () => {
                                            this.navService.pop().subscribe(() => {
                                                this.navService.push(NavPathEnum.STOCK_MOVEMENT_MENU, {
                                                    goToDropDirectly: true
                                                });
                                            });
                                        }
                                    }))
                                )
                                .subscribe(() => {
                                    this.pageIsRedirecting = false;
                                });
                        }
                        else {
                            this.pageIsRedirecting = false;
                        }
                    });
                }
            });
        }
    }

    private unsubscribeNotification(): void {
        if (this.notificationSubscription && !this.notificationSubscription.closed) {
            this.notificationSubscription.unsubscribe();
        }
        this.notificationSubscription = undefined;
    }

    private unsubscribeSynchroniseAction(): void {
        if (this.synchroniseActionSubscription && !this.synchroniseActionSubscription.closed) {
            this.synchroniseActionSubscription.unsubscribe();
        }
        this.synchroniseActionSubscription = undefined;
    }

    private displayGlobalMenu(mobileRightsArray: Array<Observable<boolean>>): Observable<boolean> {
        return zip(...mobileRightsArray)
            .pipe(map((results: Array<boolean>) => results.some((value: boolean) => value)));
    }
}
