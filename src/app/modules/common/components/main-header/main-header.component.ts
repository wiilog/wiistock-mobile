import {Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {Observable, Subscription, zip} from 'rxjs';
import {filter, mergeMap, map, take, tap} from 'rxjs/operators';
import {TitleConfig} from './title-config';
import {MainHeaderService} from '@app/services/main-header.service';
import {StorageService} from '@app/services/storage/storage.service';
import {ActivatedRoute, NavigationEnd, NavigationStart, Router} from '@angular/router';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {RouterDirection} from '@ionic/core';
import {NavService} from '@app/services/nav/nav.service';
import {NavController} from '@ionic/angular';
import {UserService} from '@app/services/user.service';
import {ServerImageKeyEnum} from '@app/services/server-image/server-image-key.enum';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {AlertService} from '@app/services/alert.service';
import {Translations} from '@entities/translation';
import {TranslationService} from '@app/services/translations.service';
import {ApiService} from "@app/services/api.service";
import {LoadingService} from "@app/services/loading.service";

@Component({
    selector: 'wii-main-header',
    templateUrl: 'main-header.component.html',
    styleUrls: ['./main-header.component.scss']
})
export class MainHeaderComponent implements OnInit, OnDestroy {

    public readonly HEADER_IMAGE_KEY: ServerImageKeyEnum = ServerImageKeyEnum.HEADER_IMAGE_KEY;

    @Output()
    public withHeader: EventEmitter<boolean>;

    @Output()
    public heightChange: EventEmitter<number>;

    @ViewChild('content', {read: ElementRef, static: false})
    public content: ElementRef;

    public loggedUser: string;

    public currentTitles: Array<TitleConfig>;
    public pageStack: Array<TitleConfig>;
    public titlesConfig: Array<TitleConfig>;
    public subTitle$: Observable<string>;

    public readonly iconMenuHide: Array<NavPathEnum> = [
        NavPathEnum.MAIN_MENU,
        NavPathEnum.PARAMS,
    ];

    public readonly iconLogoutShow: Array<NavPathEnum> = [
        NavPathEnum.MAIN_MENU,
    ];

    public readonly iconLeftHide: Array<string> = [];

    public readonly userHide: Array<NavPathEnum> = [
        NavPathEnum.PARAMS,
    ];

    public readonly headerHide: Array<NavPathEnum> = [
        NavPathEnum.LOGIN,
        NavPathEnum.IMAGE_VIEWER,
    ];

    public currentPagePath: NavPathEnum;
    public loading: boolean;
    public readonly isShown: {
        iconLogout?: boolean;
        iconLeft?: boolean;
        user?: boolean;
        menu?: boolean;
        header?: boolean;
    } = {};

    public routeStartChangeSubscription?: Subscription;
    public routeEndChangeSubscription?: Subscription;
    public popSubscription?: Subscription;
    public logoutSubscription?: Subscription;

    private pagesInStack: number;
    private readonly lastDirections: {
        [idNavigation: number]: {
            value: RouterDirection;
            origin: string;
        }
    };
    private lastRouteNavigated: string;

    public titleLabelTranslations: Translations = {};

    public deliveryOrderTranslation: string;
    public environment: string;

    public constructor(private storageService: StorageService,
                       private sqliteService: SqliteService,
                       private navController: NavController,
                       private navService: NavService,
                       private mainHeaderService: MainHeaderService,
                       private activatedRoute: ActivatedRoute,
                       private userService: UserService,
                       public router: Router,
                       private alertService: AlertService,
                       private translationService: TranslationService,
                       private apiService: ApiService,
                       private loadingService: LoadingService) {
        this.pagesInStack = 0;
        this.loading = true;
        this.withHeader = new EventEmitter<boolean>();
        this.heightChange = new EventEmitter<number>();
        this.currentTitles = [];
        this.pageStack = [];
        this.subTitle$ = this.mainHeaderService.subTitle$;
        this.lastDirections = {};

        this.mainHeaderService.environment$.subscribe((environment) => {
            this.environment = environment;
        });

        this.translationService.changedTranslations$
            .pipe(
                mergeMap(() => (
                        this.translationService.get(null, `Ordre`, `Livraison`)
                    )
                )
            ).subscribe((deliveryOrderTranslations: Translations) => {
                this.deliveryOrderTranslation = TranslationService.Translate(deliveryOrderTranslations, 'Livraison');

                this.initTitlesConfig();
            });

        this.initTitlesConfig();
    }

    public initTitlesConfig(): void {
        this.titlesConfig = [
            {pagePath: NavPathEnum.TRACKING_MENU, label: 'Traçabilité'},
            {pagePath: NavPathEnum.DISPATCH_MENU, label: 'Acheminements'},
            {pagePath: NavPathEnum.STOCK_MENU, label: 'Stock'},
            {pagePath: NavPathEnum.TRANSPORT_ROUND_LIST, label: 'Track', noBreadcrumb: true},
            {pagePath: NavPathEnum.ASSOCIATION, label: 'Association UL - Articles'},
            {pagePath: NavPathEnum.ARTICLE_CREATION_SCAN_RFID_TAG, label: 'Créer article'},
            {
                pagePath: NavPathEnum.EMPLACEMENT_SCAN,
                label: 'Association UL - Articles',
                filter: (params) => (
                    params.customAction
                )
            },
            {
                pagePath: NavPathEnum.EMPLACEMENT_SCAN,
                label: 'Prise',
                filter: (params) => (
                    (typeof params.fromDepose === 'boolean') &&
                    !params.fromDepose && !params.customAction
                )
            },
            {
                pagePath: NavPathEnum.EMPLACEMENT_SCAN,
                label: 'Dépose',
                filter: (params) => (
                    (typeof params.fromDepose === 'boolean') &&
                    params.fromDepose && !params.customAction
                )
            },
            {pagePath: NavPathEnum.STOCK_MOVEMENT_MENU, label: 'Transfert manuel'},
            {pagePath: NavPathEnum.PREPARATION_MENU, label: 'Préparation'},
            {
                pagePath: NavPathEnum.LIVRAISON_MENU,
                label: this.deliveryOrderTranslation || `Livraison`,
            },
            {pagePath: NavPathEnum.MANUAL_DELIVERY, label: 'Livraison manuelle'},
            {pagePath: NavPathEnum.MANUAL_DELIVERY_LOCATION, label: 'Emplacement'},
            {pagePath: NavPathEnum.COLLECTE_MENU, label: 'Collecte'},
            {pagePath: NavPathEnum.INVENTORY_LOCATIONS, label: 'Inventaire'},
            {pagePath: NavPathEnum.INVENTORY_LOCATIONS_ANOMALIES, label: 'Anomalies'},
            {pagePath: NavPathEnum.DEMANDE_MENU, label: 'Demande'},
            {pagePath: NavPathEnum.HANDLING_MENU, label: 'Service'},
            {
                pagePath: NavPathEnum.DEMANDE_LIVRAISON_MENU,
                label: `Livraison`,
            },
            {pagePath: NavPathEnum.DISPATCH_WAYBILL, label: 'Lettre de voiture'},
            {
                pagePath: NavPathEnum.DISPATCH_REQUEST_MENU,
                label: 'Acheminement',
                filter: (params) => (
                    (typeof params.dispatchOfflineMode === 'boolean') && !params.dispatchOfflineMode
                )
            },
            {
                pagePath: NavPathEnum.DISPATCH_REQUEST_MENU,
                label: 'Acheminement | Hors ligne',
                filter: (params) => (
                    (typeof params.dispatchOfflineMode === 'boolean') && params.dispatchOfflineMode
                )
            },
            {pagePath: NavPathEnum.DISPATCH_NEW, label: 'Création'},
            {pagePath: NavPathEnum.HANDLING_VALIDATE, label: 'Création'},
            {pagePath: NavPathEnum.GROUP_SCAN_GROUP, label: 'Groupage'},
            {pagePath: NavPathEnum.UNGROUP_SCAN_LOCATION, label: 'Dégroupage'},
            {pagePath: NavPathEnum.TRANSPORT_LIST, label: 'Tournée'},
            {pagePath: NavPathEnum.TRANSPORT_DEPOSIT_MENU, label: 'Déposer colis'},
            {pagePath: NavPathEnum.TRANSPORT_DEPOSIT_PACKS, label: 'Déposer colis'},
            {pagePath: NavPathEnum.TRANSPORT_ROUND_FINISH_PACK_DROP, label: 'Terminer tournée'},
            {pagePath: NavPathEnum.TRANSPORT_ROUND_FINISH_PACK_DROP_VALIDATE, label: 'Terminer tournée'},
            {pagePath: NavPathEnum.TRANSPORT_ROUND_FINISH, label: 'Terminer tournée'},
            {pagePath: NavPathEnum.DISPATCH_GROUPED_SIGNATURE, label: 'Signature groupée'},
            {pagePath: NavPathEnum.DISPATCH_GROUPED_SIGNATURE_VALIDATE, label: 'Validation'},
            {pagePath: NavPathEnum.TRUCK_ARRIVAL_CARRIER, label: 'Arrivage camion'},
            {
                pagePath: NavPathEnum.TRANSPORT_COLLECT_NATURES,
                label: 'Déposer colis',
                filter: params => params.round,
            },
            {
                pagePath: NavPathEnum.TRANSPORT_SHOW,
                label: `Livraison`,
                filter: (params) => (
                    params.transport?.kind === 'delivery'
                )
            },
            {
                pagePath: NavPathEnum.TRANSPORT_SHOW,
                label: 'Collecte',
                filter: (params) => (
                    params.transport?.kind === 'collect'
                )
            },
            {
                pagePath: NavPathEnum.EMPLACEMENT_SCAN,
                label: 'Passage à vide',
                filter: (params) => (
                    params.fromEmptyRound
                )
            },
            {pagePath: NavPathEnum.TRUCK_ARRIVAL_CARRIER, label: 'Arrivage camion'},
            {pagePath: NavPathEnum.RECEIPT_ASSOCIATION_MENU, label: 'Association BR'},
        ];
    }

    public ngOnInit(): void {
        this.clearSubTitle();

        this.routeStartChangeSubscription = (this.router.events
            .pipe(
                filter((event) => (event instanceof NavigationStart))
            ) as Observable<NavigationStart>)
            .subscribe(({id}: NavigationStart) => {
                this.clearSubTitle();
                if(id) {
                    const transition = this.navController.consumeTransition();
                    const direction = transition && transition.direction;
                    if(direction) {
                        this.lastDirections[id] = {
                            value: direction,
                            origin: this.lastRouteNavigated
                        };
                    }
                }
            });

        this.routeEndChangeSubscription = (this.router.events
            .pipe(
                filter((event) => (event instanceof NavigationEnd)),
                mergeMap((data) => this.refreshUser().pipe(map(() => data)))
            ) as Observable<NavigationEnd>)
            .subscribe((navigation: NavigationEnd) => {
                const {url, id: navigationId} = navigation;
                const [path] = (url || '').split('?');
                const urlSplit = (path || '').split('/').filter(Boolean);
                if(urlSplit && urlSplit.length > 0) {
                    if(this.loading) {
                        this.loading = false;
                    }
                    this.currentPagePath = urlSplit[urlSplit.length - 1] as NavPathEnum;
                    this.lastRouteNavigated = this.currentPagePath;

                    this.isShown.iconLogout = this.iconLogoutShow.indexOf(this.currentPagePath) > -1;
                    this.isShown.iconLeft = this.iconLeftHide.indexOf(this.currentPagePath) === -1;
                    this.isShown.user = this.userHide.indexOf(this.currentPagePath) === -1;
                    this.isShown.menu = this.iconMenuHide.indexOf(this.currentPagePath) === -1;
                    this.isShown.header = this.headerHide.indexOf(this.currentPagePath) === -1;

                    const {paramsId} = (this.activatedRoute.snapshot.queryParams || {paramsId: undefined});
                    this.refreshTitles(navigationId, this.currentPagePath, paramsId);
                    this.withHeader.emit(this.headerHide.indexOf(this.currentPagePath) === -1);
                }
            });
    }

    public ngOnDestroy(): void {
        if(this.routeStartChangeSubscription) {
            this.routeStartChangeSubscription.unsubscribe();
            this.routeStartChangeSubscription = undefined;
        }
        if(this.routeEndChangeSubscription) {
            this.routeEndChangeSubscription.unsubscribe();
            this.routeEndChangeSubscription = undefined;
        }
        if(this.logoutSubscription) {
            this.logoutSubscription.unsubscribe();
            this.logoutSubscription = undefined;
        }
        if(this.popSubscription && !this.popSubscription.closed) {
            this.popSubscription.unsubscribe();
            this.popSubscription = undefined;
        }
    }

    public goHome(): void {
        this.mainHeaderService.emitNavigationChange();
        this.navService.setRoot(NavPathEnum.MAIN_MENU);
    }

    public onTitleClick(last: boolean, titleConfig: TitleConfig): void {
        if(!last && !this.popSubscription) {
            if(titleConfig && titleConfig.stackIndex) {
                const nbNavigateBack = (this.pagesInStack - titleConfig.stackIndex);
                if(nbNavigateBack > 0) {
                    this.popSubscription = this.navService.pop({number: nbNavigateBack}).subscribe(() => {
                        if(this.popSubscription && !this.popSubscription.closed) {
                            this.popSubscription.unsubscribe();
                            this.popSubscription = undefined;
                        }
                    });
                }
            }
        }
    }

    public onLeftIconClick(): void {
        return this.isShown.iconLogout
            ? this.doLogout()
            : this.doPop();
    }

    private doPop(): void {
        this.mainHeaderService.emitNavigationChange();
        this.navService.pop();
    }

    private doLogout(): void {
        const where = [
            `type LIKE 'prise'`,
            `finished = 0`,
            `fromStock = 0`,
        ];

        zip(
            this.sqliteService.findBy('mouvement_traca', where),
            this.storageService.getRight(StorageKeyEnum.DISPATCH_OFFLINE_MODE)
        ).subscribe(async ([result, isDispatchOfflineMode]: [any, boolean]) => {
            if(result.length) {
                await this.alertService.show({
                    header: 'Déconnexion impossible',
                    message: `Vous ne pouvez pas vous déconnecter car il y a des prises de traçabilité en cours`,
                    buttons: [{
                        text: 'Annuler',
                        role: 'cancel'
                    }]
                });
            } else {
                if(isDispatchOfflineMode) {
                    await this.alertService.show({
                        header: `Vous êtes en mode hors-ligne sur les acheminements. Vos données seront perdues si elles ne sont pas synchronisées.`,
                        backdropDismiss: false,
                        buttons: [
                            {
                                text: 'Annuler',
                                role: 'cancel',
                            },
                            {
                                text: 'Confirmer',
                                handler: () => {
                                    this.loadingService.presentLoadingWhile({
                                        event: () => this.apiService.requestApi(ApiService.LOGOUT),
                                    }).subscribe(() => this.userService.doLogout());
                                },
                                cssClass: 'alert-success'
                            }
                        ]
                    });
                } else {
                    this.loadingService.presentLoadingWhile({
                        event: () => this.apiService.requestApi(ApiService.LOGOUT),
                    }).subscribe(() => this.userService.doLogout());
                }
            }
        });
    }

    private refreshTitles(navigationId: number, currentPagePath: NavPathEnum, paramsId: number): void {
        if(navigationId && this.lastDirections[navigationId]) {
            if(this.router.url.startsWith('/main-menu')) {
                this.pagesInStack = 1;
                this.pageStack = [];
            }

            if(this.lastDirections[navigationId].value === 'back') {
                const currentPageIndex = this.findIndexInPageStack(currentPagePath, paramsId);
                if(currentPageIndex > -1) {
                    this.pagesInStack = this.pageStack[currentPageIndex].stackIndex || 0;
                    this.pageStack = this.pageStack.slice(0, currentPageIndex + 1)
                    this.refreshCurrentTitles();
                } else {
                    this.pagesInStack--;
                }
            } else {
                if(this.lastDirections[navigationId].value === 'root') {
                    this.pagesInStack = 1;
                    this.pageStack = [];
                } else {
                    this.pagesInStack++;
                }
                this.findTitleAndPushConfig(currentPagePath, paramsId);
            }
            delete this.lastDirections[navigationId];
        } else {
            this.findTitleAndPushConfig(currentPagePath, paramsId);
        }
    }

    private refreshUser(): Observable<void> {
        return this.storageService
            .getString(StorageKeyEnum.OPERATOR, UserService.MAX_PSEUDO_LENGTH)
            .pipe(
                take(1),
                tap((user: string|null) => {
                    if (user) {
                        this.loggedUser = user;
                    }
                }),
                map(() => undefined)
            );
    }

    private clearSubTitle(): void {
        this.mainHeaderService.emitSubTitle('');
    }

    private findTitleAndPushConfig(currentPagePath: NavPathEnum, paramsId: number): void {
        const indexInPageStack = this.findIndexInPageStack(currentPagePath, paramsId);
        if(indexInPageStack === -1) {
            let currentTitleConfig = this.findTitleConfig(currentPagePath, paramsId);
            if(!currentTitleConfig) {
                currentTitleConfig = {pagePath: currentPagePath};
            }
            if(currentTitleConfig.noBreadcrumb) {
                this.pageStack = [currentTitleConfig];
            } else {
                this.pageStack.push({...currentTitleConfig, stackIndex: this.pagesInStack});
            }
            this.refreshCurrentTitles();
        }
    }

    private findIndexInPageStack(pagePath: string, paramsId: number): number {
        const currentNavParams = this.navService.params(paramsId);
        return this.pageStack.findIndex(({pagePath: currentPagePath, filter}) => (
            (pagePath === currentPagePath)
            && (!filter || filter(currentNavParams))
        ));
    }

    private findTitleConfig(path: string, paramsId: number): TitleConfig|undefined {
        this.titlesConfig = this.titlesConfig.filter((config, index) =>
            this.titlesConfig.findIndex(({label}) => label === config.label) === index
        );
        const currentNavParams = this.navService.params(paramsId);
        return this.titlesConfig.find(({pagePath, filter}) => (
            (pagePath === path)
            && (!filter || filter(currentNavParams))
        ));
    }

    private refreshCurrentTitles() {
        this.currentTitles = this.pageStack.filter(({label}) => Boolean(label));
    }
}
