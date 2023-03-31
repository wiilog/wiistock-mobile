import {Component, NgZone} from '@angular/core';
import {MenuConfig} from '@common/components/menu/menu-config';
import {Observable, Subject, Subscription, zip} from 'rxjs';
import {mergeMap, map} from 'rxjs/operators';
import {Platform, ViewWillEnter, ViewWillLeave} from '@ionic/angular';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {StorageService} from '@app/services/storage/storage.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {ToastService} from '@app/services/toast.service';
import {NavService} from '@app/services/nav/nav.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
// import {ILocalNotification} from '@ionic-native/local-notifications'; // TODO WIIS-7970
// import {NotificationService} from '@app/services/notification.service'; // TODO WIIS-7970
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {AlertService} from '@app/services/alert.service';
import {NetworkService} from '@app/services/network.service';
import {ApiService} from '@app/services/api.service';


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

    // TODO migration // TODO WIIS-7970
    private exitAlert?: HTMLIonAlertElement;

    private backButtonSubscription?: Subscription;
    private synchronisationSubscription?: Subscription;
    private synchroniseActionSubscription?: Subscription;
    private notificationSubscription?: Subscription;

    private pageIsRedirecting: boolean;
    // private lastNotificationRedirected: ILocalNotification; // TODO WIIS-7970

    public constructor(private alertService: AlertService,
                       private apiService: ApiService,
                       private sqliteService: SqliteService,
                       private storageService: StorageService,
                       private localDataManager: LocalDataManagerService,
                       private toastService: ToastService,
                       private networkService: NetworkService,
                       private platform: Platform,
                       private ngZone: NgZone,
                       // private notificationService: NotificationService, // TODO WIIS-7970
                       private navService: NavService) {
        this.loading = true;
        this.displayNotifications = false;
        this.pageIsRedirecting = false;
    }

    public ionViewWillEnter(): void {
        const notification = this.navService.params();

        this.synchronise().subscribe(() => {
            // TODO WIIS-7970
            // if (notification && this.lastNotificationRedirected !== notification) {
            //     this.doNotificationRedirection(notification);
            // }
        });

        // TODO WIIS-7970 backButton
        // this.backButtonSubscription = this.platform.backButton.subscribe(() => {
        //     this.onBackButton();
        // });
        // TODO WIIS-7970
        // this.notificationSubscription = this.notificationService.$localNotification.subscribe((notification) => {
        //     this.doSynchronisationAndNotificationRedirection(notification);
        // });
    }

    public ionViewWillLeave(): void {
        if (this.backButtonSubscription) {
            this.backButtonSubscription.unsubscribe();
            this.backButtonSubscription = undefined;
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

                this.synchronisationSubscription = this.localDataManager.synchroniseData()
                    .pipe(
                        mergeMap(({finished, message}) => (
                            zip(
                                this.storageService.getRight(StorageKeyEnum.RIGHT_DEMANDE),
                                this.storageService.getRight(StorageKeyEnum.RIGHT_TRACKING),
                                this.storageService.getRight(StorageKeyEnum.RIGHT_STOCK),
                                this.storageService.getRight(StorageKeyEnum.RIGHT_TRACK),
                            ).pipe(map(([demande, tracking, stock, track]) => ({
                                finished,
                                message,
                                rights: {demande, tracking, stock, track}
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

    private async onBackButton(): Promise<void> {
        if (this.exitAlert) {
            this.exitAlert.dismiss();
            this.exitAlert = undefined;
        }
        else {
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
                            // TODO WIIS-7970
                            // navigator['app'].exitApp();
                        },
                        cssClass: 'alert-success'
                    }
                ]
            });
        }
    }

    private resetMainMenuConfig(rights: {stock?: boolean, demande?: boolean, tracking?: boolean, track?: boolean}) {
        this.menuConfig = [];

        const actions = [];

        if (rights.tracking) {
            const action = () => {
                this.navService.push(NavPathEnum.TRACKING_MENU, {
                    fromStock: false
                });
            }
            this.menuConfig.push({
                icon: 'tracking.svg',
                label: 'Traçabilité',
                action
            });
            actions.push(action);
        }

        if (rights.stock) {
            const action = () => {
                this.navService.push(NavPathEnum.STOCK_MENU, {avoidSync: true});
            }
            this.menuConfig.push({
                icon: 'stock.svg',
                label: 'Stock',
                action
            });
            actions.push(action);
        }

        if (rights.demande) {
            const action = () => {
                this.navService.push(NavPathEnum.DEMANDE_MENU);
            };
            this.menuConfig.push({
                icon: 'demande.svg',
                iconColor: 'success',
                label: 'Demande',
                action
            });
            actions.push(action);
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

    private doSynchronisationAndNotificationRedirection(/* notification: ILocalNotification*/ /* TODO WIIS-7970*/): void {
        // TODO WIIS-7970
        // if(notification && !this.synchroniseActionSubscription) {
        //     this.synchroniseActionSubscription = this.synchronise()
        //         .subscribe({
        //             next: () => {
        //                 this.doNotificationRedirection(notification);
        //                 this.unsubscribeSynchroniseAction();
        //             },
        //             error: () => {
        //                 this.unsubscribeSynchroniseAction();
        //             },
        //             complete: () => {
        //                 this.unsubscribeSynchroniseAction();
        //             }
        //         });
        // }
    }

    // TODO WIIS-7970
    /*
    private doNotificationRedirection(notification: ILocalNotification) {
        if (!this.pageIsRedirecting && notification) {
            this.lastNotificationRedirected = notification;
            this.ngZone.run(() => {
                const {data} = notification;
                if(data.type === 'transport') {
                    this.apiService.requestApi(ApiService.FETCH_ROUND, {
                        params: {request: data.id},
                    }).subscribe(round => {
                        this.navService
                            .push(NavPathEnum.TRANSPORT_ROUND_LIST)
                            .pipe(mergeMap(() => this.navService.push(NavPathEnum.TRANSPORT_LIST, {
                                round,
                                cancelledTransport: data.id,
                            })))
                            .subscribe(() => {
                                this.pageIsRedirecting = false;
                            });
                    });
                }
                else if (data.type === 'round') {
                    this.navService.push(NavPathEnum.TRANSPORT_ROUND_LIST).subscribe(() => {
                        this.pageIsRedirecting = false;
                    });
                }
                else if (data.type === 'dispatch') {
                    this.pageIsRedirecting = true;
                    const dispatchId = Number(data.id);
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
                                    mergeMap(() => this.navService.push(NavPathEnum.DISPATCH_PACKS, {dispatchId}))
                                )
                                .subscribe(() => {
                                    this.pageIsRedirecting = false;
                                });
                        }
                    })
                }
                else if (data.type === 'service') {
                    this.pageIsRedirecting = true;
                    const handlingId = Number(data.id);
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
                else if (data.type === 'transfer') {
                    this.pageIsRedirecting = true;
                    const transferId = Number(data.id);
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
                else if (data.type === 'preparation') {
                    this.pageIsRedirecting = true;
                    const preparationId = Number(data.id);
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
                else if (data.type === 'delivery') {
                    this.pageIsRedirecting = true;
                    const deliveryId = Number(data.id);
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
                else if (data.type === 'collect') {
                    this.pageIsRedirecting = true;
                    const collectId = Number(data.id);
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
*/
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
}
