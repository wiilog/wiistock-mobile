import {Component} from '@angular/core';
import {Subscription, zip} from 'rxjs';
import {ColumnNumber, MenuConfig} from '@common/components/menu/menu-config';
import {ViewWillEnter, ViewWillLeave} from '@ionic/angular';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {ToastService} from '@app/services/toast.service';
import {NavService} from '@app/services/nav/nav.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {StatsSlidersData} from '@common/components/stats-sliders/stats-sliders-data';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {StorageService} from '@app/services/storage/storage.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {map} from 'rxjs/operators';
import {NetworkService} from '@app/services/network.service';
import {LoadingService} from "@app/services/loading.service";
import {TranslationService} from "@app/services/translations.service";

@Component({
    selector: 'wii-stock-menu',
    templateUrl: './stock-menu.page.html',
    styleUrls: ['./stock-menu.page.scss'],
})
export class StockMenuPage implements ViewWillEnter, ViewWillLeave {
    public readonly ColumnNumber = ColumnNumber;
    public statsSlidersData: Array<StatsSlidersData | [StatsSlidersData, StatsSlidersData, StatsSlidersData, StatsSlidersData]>;

    public menuConfig: Array<MenuConfig>;

    public messageLoading?: string;
    public loading: boolean;
    public synchroniseLoading: boolean;

    private avoidSync: boolean;
    private synchronisationSubscription?: Subscription;
    private navigationSubscription?: Subscription;
    private deposeAlreadyNavigate: boolean;

    public deliveryOrderTranslation: string;

    public constructor(private localDataManager: LocalDataManagerService,
                       private networkService: NetworkService,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       private loadingService: LoadingService,
                       private sqliteService: SqliteService,
                       private navService: NavService,
                       private translationService: TranslationService) {
    }

    public ionViewWillEnter(): void {
        if (this.navService.currentPath() !== NavPathEnum.STOCK_MENU) {
            return;
        }

        this.menuConfig = [];
        this.avoidSync = this.navService.param<boolean>(`avoidSync`);

        // TODO WIIS-7970 test this
        const goToDropDirectly = (!this.deposeAlreadyNavigate && Boolean(this.navService.param('goToDropDirectly')));

        this.loadingService.presentLoadingWhile({
            event: () => zip(
                this.storageService.getRight(StorageKeyEnum.RIGHT_CREATE_ARTICLE_FROM_NOMADE),
                this.storageService.getRight(StorageKeyEnum.RIGHT_PREPARATION),
                this.storageService.getRight(StorageKeyEnum.RIGHT_DELIVERY_ORDER),
                this.storageService.getRight(StorageKeyEnum.RIGHT_MANUAL_DELIVERY),
                this.storageService.getRight(StorageKeyEnum.RIGHT_COLLECT_ORDER),
                this.storageService.getRight(StorageKeyEnum.RIGHT_MANUAL_COLLECT),
                this.storageService.getRight(StorageKeyEnum.RIGHT_TRANSFER_ORDER),
                this.storageService.getRight(StorageKeyEnum.RIGHT_MANUAL_TRANSFER),
                this.storageService.getRight(StorageKeyEnum.RIGHT_INVENTORY),
                this.storageService.getRight(StorageKeyEnum.RIGHT_ARTICLE_UL_ASSOCIATION),
                this.storageService.getRight(StorageKeyEnum.RIGHT_RECEPTION),
                this.translationService.get(null, `Ordre`, `Livraison`)
            )
        }).subscribe(([hasRightDisplayCreateArticleButton, preparation, deliveryOrder, manualDelivery, collectOrder, manualCollect, transferOrder, manualTransfer, inventory, articleUlAssociation, reception, deliveryOrderTranslations]) => {
            this.deliveryOrderTranslation = TranslationService.Translate(deliveryOrderTranslations, 'Livraison');

            if(reception){
                this.menuConfig.push({
                    icon: 'reception.svg',
                    label: 'Réception',
                    action: () => {
                        this.navService.push(NavPathEnum.RECEPTION_MENU);
                    }
                });
            }

            if(preparation){
                this.menuConfig.push({
                    icon: 'preparation.svg',
                    label: 'Préparation',
                    action: () => {
                        this.navService.push(NavPathEnum.PREPARATION_MENU);
                    }
                });
            }

            if(deliveryOrder){
                this.menuConfig.push({
                    icon: 'delivery.svg',
                    label: this.deliveryOrderTranslation,
                    action: () => {
                        this.navService.push(NavPathEnum.LIVRAISON_MENU);
                    }
                });
            }

            if(manualDelivery){
                this.menuConfig.push({
                    icon: 'manual-delivery.svg',
                    label: `Livraison manuelle`,
                    action: () => {
                        this.navService.push(NavPathEnum.MANUAL_DELIVERY);
                    }
                });
            }

            if(collectOrder){
                this.menuConfig.push({
                    icon: 'collect.svg',
                    label: 'Collecte',
                    action: () => {
                        this.navService.push(NavPathEnum.COLLECTE_MENU, {
                            avoidSync: () => {
                                this.setAvoidSync(true);
                            },
                            goToDrop: () => {
                                this.goToDrop();
                            }
                        });
                    }
                });
            }

            if(manualCollect){
                this.menuConfig.push({
                    icon: 'manual-collect.svg',
                    label: 'Collecte manuelle',
                    action: () => {
                        this.navService.push(NavPathEnum.MANUAL_COLLECT_ARTICLES);
                    }
                });
            }

            if(transferOrder){
                this.menuConfig.push({
                    icon: 'stock-transfer.svg',
                    label: 'Transfert',
                    action: () => {
                        this.navService.push(NavPathEnum.TRANSFER_LIST);
                    }
                });
            }

            if(manualTransfer){
                this.menuConfig.push({
                    icon: 'manual-transfer.svg',
                    label: 'Transfert<br/>manuel',
                    action: () => {
                        this.navigateToPriseDeposePage()
                    }
                });
            }

            if(inventory){
                this.menuConfig.push({
                    icon: 'inventory.svg',
                    label: 'Inventaire',
                    action: () => {
                        this.navService.push(NavPathEnum.INVENTORY_LOCATIONS);
                    }
                });
            }

            if(articleUlAssociation){
                this.menuConfig.push({
                    icon: 'association.svg',
                    label: 'Association Articles - UL',
                    action: () => {
                        this.navService.push(NavPathEnum.ASSOCIATION);
                    }
                });
            }

            if(hasRightDisplayCreateArticleButton){
                this.menuConfig.push({
                    icon: 'new-article-RFID.svg',
                    label: 'Créer article',
                    action: () => {
                        this.navService.push(NavPathEnum.ARTICLE_CREATION_SCAN_RFID_TAG);
                    }
                });
            }

            this.synchronise(false);

            if (this.navService.popItem?.path === NavPathEnum.STOCK_MENU
                && this.navService.popItem.params?.avoidSync === false) {
                this.synchronise(true);
            }

            if (goToDropDirectly) {
                this.deposeAlreadyNavigate = true;
                this.navigateToPriseDeposePage(true);
            }
        });
    }

    public ionViewWillLeave(): void {
        if (this.synchronisationSubscription) {
            this.synchronisationSubscription.unsubscribe();
            this.synchronisationSubscription = undefined;
        }
        if (this.navigationSubscription) {
            this.navigationSubscription.unsubscribe();
            this.navigationSubscription = undefined;
        }
    }

    public synchronise(force: boolean = true): void {
        if (!this.avoidSync || force) {
            this.networkService.hasNetwork().then((hasNetwork) => {
                if (hasNetwork && !this.synchroniseLoading) {
                    this.loading = true;
                    this.synchroniseLoading = true;

                    this.synchronisationSubscription = this.localDataManager.synchroniseData().subscribe({
                        next: ({finished, message}) => {
                            this.messageLoading = message;
                            this.loading = !finished;
                            this.synchroniseLoading = !finished;
                            this.refreshSlidersData();
                        },
                        error: (error) => {
                            const {api, message} = error;
                            this.synchroniseLoading = false;
                            this.refreshSlidersData();
                            if (api && message) {
                                this.toastService.presentToast(message);
                            }
                            throw error;
                        }
                    });
                } else {
                    this.synchroniseLoading = false;
                    this.refreshSlidersData();
                    this.toastService.presentToast('Veuillez vous connecter à internet afin de synchroniser vos données');
                }
            });
        } else {
            this.avoidSync = false;
            this.refreshSlidersData();
        }
    }

    public goToDrop() {
        this.navService
            .push(NavPathEnum.STOCK_MOVEMENT_MENU, {
                fromStock: true,
                goToDropDirectly: true
            });
    }

    public setAvoidSync(avoidSync: boolean) {
        this.avoidSync = avoidSync;
    }

    public refreshSlidersData(): void {
        if (!this.loading) {
            this.loading = true;
            zip(
                zip(
                    this.storageService.getCounter(StorageKeyEnum.COUNTERS_TRANSFERS_TREATED),
                    this.sqliteService.count('transfer_order', ['treated <> 1'])
                ).pipe(map(([treated, toTreat]) => ({treated, toTreat}))),
                zip(
                    this.storageService.getCounter(StorageKeyEnum.COUNTERS_PREPARATIONS_TREATED),
                    this.sqliteService.count('preparation', ['date_end IS NULL'])
                ).pipe(map(([treated, toTreat]) => ({treated, toTreat}))),
                zip(
                    this.storageService.getCounter(StorageKeyEnum.COUNTERS_COLLECTS_TREATED),
                    this.sqliteService.count('collecte', ['date_end IS NULL', 'location_to IS NULL'])
                ).pipe(map(([treated, toTreat]) => ({treated, toTreat}))),
                zip(
                    this.storageService.getCounter(StorageKeyEnum.COUNTERS_DELIVERIES_TREATED),
                    this.sqliteService.count('livraison', ['date_end IS NULL'])
                ).pipe(map(([treated, toTreat]) => ({treated, toTreat})))
            )
                .subscribe({
                    next: ([transfers, preparations, collects, deliveries]) => {
                        this.loading = false;
                        this.statsSlidersData = this.createSlidersData(transfers, preparations, collects, deliveries);
                    },
                    error: () => {
                        this.loading = false;
                    }
                });
        }
    }

    private createSlidersData(transfers: {treated: number, toTreat: number},
                              preparations: {treated: number, toTreat: number},
                              collects: {treated: number, toTreat: number},
                              deliveries: {treated: number, toTreat: number}): Array<StatsSlidersData | [StatsSlidersData, StatsSlidersData, StatsSlidersData, StatsSlidersData]> {
        const sToTreat = {
            transfers: transfers.toTreat > 1 ? 's' : '',
            preparations: preparations.toTreat > 1 ? 's' : '',
            collects: collects.toTreat > 1 ? 's' : '',
            deliveries: deliveries.toTreat > 1 ? 's' : '',
        };
        const sTreated = {
            transfers: transfers.treated > 1 ? 's' : '',
            preparations: preparations.treated > 1 ? 's' : '',
            collects: collects.treated > 1 ? 's' : '',
            deliveries: deliveries.treated > 1 ? 's' : '',
        };
        return [
            [
                {label: `Transfert${sToTreat.transfers} à traiter`, counter: transfers.toTreat},
                {label: `Préparation${sToTreat.preparations} à traiter`, counter: preparations.toTreat},
                {label: `Collecte${sToTreat.collects} à traiter`, counter: collects.toTreat},
                {label: `${this.deliveryOrderTranslation}${sToTreat.deliveries} à traiter`, counter: deliveries.toTreat},
            ],
            [
                {
                    label: `Transfert${sTreated.transfers} traité${sTreated.transfers}`,
                    counter: transfers.treated
                },
                {
                    label: `Préparation${sTreated.preparations} traitée${sTreated.preparations}`,
                    counter: preparations.treated
                },
                {
                    label: `Collecte${sTreated.collects} traitée${sTreated.collects}`,
                    counter: collects.treated
                },
                {
                    label: `${this.deliveryOrderTranslation}${sTreated.deliveries} traitée${sTreated.deliveries}`,
                    counter: deliveries.treated
                },
            ],
        ];
    }


    public navigateToPriseDeposePage(goToDropDirectly: boolean = false): void {
        this.navService
            .push(NavPathEnum.STOCK_MOVEMENT_MENU, {
                fromStock: true,
                goToDropDirectly
            });
    }

}
