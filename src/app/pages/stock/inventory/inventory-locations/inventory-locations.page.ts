import {Component, ViewChild} from '@angular/core';
import {BarcodeScannerModeEnum} from '@common/components/barcode-scanner/barcode-scanner-mode.enum';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {NavService} from '@app/services/nav/nav.service';
import {LoadingService} from '@app/services/loading.service';
import {MainHeaderService} from '@app/services/main-header.service';
import {ToastService} from '@app/services/toast.service';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {SelectItemComponent} from '@common/components/select-item/select-item.component';
import {SelectItemTypeEnum} from '@common/components/select-item/select-item-type.enum';
import {tap} from 'rxjs/operators';
import {Observable, of, ReplaySubject, Subscription, zip} from 'rxjs';
import {StorageService} from '@app/services/storage/storage.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {TabConfig} from '@common/components/tab/tab-config';
import {ArticleInventaire} from '@entities/article-inventaire';
import {ListPanelItemConfig} from '@common/components/panel/model/list-panel/list-panel-item-config';
import * as moment from 'moment';
import {Anomalie} from '@entities/anomalie';
import {InventoryMission} from "@entities/inventory_mission";
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";

enum PageMode {
    LOCATIONS = 1,
    MISSIONS = 2,
}

@Component({
    selector: 'wii-inventory-locations',
    templateUrl: './inventory-locations.page.html',
    styleUrls: ['./inventory-locations.page.scss'],
})
export class InventoryLocationsPage implements ViewWillEnter, ViewWillLeave, CanLeave {

    public readonly PageMode = PageMode;

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public currentPageMode: PageMode;
    public anomalyMode: boolean;

    public tabConfig: TabConfig[] = [
        { label: 'Emplacements', key: PageMode.LOCATIONS },
        { label: 'Missions', key: PageMode.MISSIONS }
    ];

    public locationsListItemBody: Array<ListPanelItemConfig>;
    public missionsListItemBody: Array<ListPanelItemConfig>;

    public missionFilter?: number;

    public isInventoryManager: boolean;
    public hasAnomalies: boolean = false;

    public readonly scannerMode = BarcodeScannerModeEnum.TOOL_SEARCH;
    public selectItemType: SelectItemTypeEnum;
    public requestParams: Array<string> = [];

    public resetEmitter$: ReplaySubject<void>;

    public dataSubscription?: Subscription;

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       private navService: NavService) {
        this.resetEmitter$ = new ReplaySubject<void>(1);
    }

    public ionViewWillEnter(): void {
        this.missionFilter = undefined;
        this.hasAnomalies = false;
        this.resetEmitter$.next();

        const missionFilter = this.navService.param('mission');
        this.anomalyMode = this.navService.param('anomaly') || false;
        this.missionFilter = this.navService.param('missionFilter') || undefined;
        if(!this.currentPageMode) {
            this.currentPageMode = this.navService.param('currentPageMode') || PageMode.LOCATIONS;
        }
        this.selectItemType = !this.anomalyMode ? SelectItemTypeEnum.INVENTORY_LOCATION : SelectItemTypeEnum.INVENTORY_ANOMALIES_LOCATION;
        if (missionFilter) {
            this.missionFilter = missionFilter;
        }

        if (!this.dataSubscription) {
            this.dataSubscription = this.loadingService
                .presentLoadingWhile({
                    event: () => zip(
                        this.storageService.getRight(StorageKeyEnum.RIGHT_INVENTORY_MANAGER),
                        this.reloadPage()
                    )
                        .pipe(
                            tap(([isInventoryManager]: [boolean, void]) => {
                                this.isInventoryManager = isInventoryManager;
                            })
                        )
                })
                .subscribe(() => {
                    this.unsubscribeData();
                });
        }
        if (this.selectItemComponent) {
            this.selectItemComponent.fireZebraScan();
        }
    }

    public ionViewWillLeave(): void {
        this.resetEmitter$.next();
        this.unsubscribeData();
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
    }

    public wiiCanLeave(): boolean {
        return !this.dataSubscription;
    }

    public selectLocation({label}: { label: string }, missionId?: number): void {
        this.resetEmitter$.next();
        this.navigateToArticles(label, missionId);
    }

    public selectMission(missionId: number, type?: string): void {
        this.reloadPage();
        if(type === 'location'){
            this.navService.push(NavPathEnum.INVENTORY_MISSION_ZONES, {
                missionId
            });
        } else if(type === 'article'){
            this.navService.push(NavPathEnum.INVENTORY_LOCATIONS_MISSIONS, {
                missionFilter: missionId,
                currentPageMode: PageMode.LOCATIONS,
            });
        }
    }

    public navigateToAnomalies(): void {
        this.navService.push(NavPathEnum.INVENTORY_LOCATIONS_ANOMALIES, {
            anomaly: true,
            mission: this.missionFilter
        });
    }

    private navigateToArticles(selectedLocation: string, missionId?: number): void {
        this.selectItemComponent.closeSearch();
        this.navService.push(NavPathEnum.INVENTORY_ARTICLES, {
            selectedLocation,
            mission: missionId,
            anomalyMode: this.anomalyMode || false
        });
    }

    private unsubscribeData(): void {
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
            this.dataSubscription = undefined;
        }
    }

    public resetPageMode(): void {
        this.currentPageMode = PageMode.LOCATIONS;
    }

    public reloadPage(): Observable<void> {
        const res = new ReplaySubject<void>();

        this.requestParams = [];
        if (this.missionFilter) {
            this.requestParams.push(`mission_id = ${this.missionFilter}`)
        }

        zip(
            this.sqliteService.findBy<ArticleInventaire|Anomalie>(this.anomalyMode ? 'anomalie_inventaire' : 'article_inventaire'),
            this.sqliteService.findBy<InventoryMission>('inventory_mission', [], {'mission_end': 'ASC'}),
            this.sqliteService.findBy<Anomalie>(
                'anomalie_inventaire',
                this.missionFilter ? [`mission_id = ${this.missionFilter}`] : []
            ),
            this.selectItemComponent
                ? this.selectItemComponent.searchComponent.reload()
                : of(undefined)
        )
            .subscribe({
                next: ([inventoryArticles, inventoryMissions, anomalies]) => {
                    this.hasAnomalies = anomalies.length > 0;
                    if (this.currentPageMode === PageMode.LOCATIONS) {
                        this.missionsListItemBody = [];
                        this.locationsListItemBody = inventoryArticles
                            .filter(({location, mission_id}, index) => (
                                (!this.missionFilter || (mission_id === this.missionFilter))
                                // remove duplicate
                                && inventoryArticles.findIndex(({location: location2, mission_id: mission_id2}) => (
                                    (!this.missionFilter || (mission_id2 === this.missionFilter))
                                    && location2 === location
                                )) === index
                            ))
                            .sort((art1, art2) => {
                                if (art1.location > art2.location) {
                                    return 1;
                                } else if (art2.location > art1.location) {
                                    return -1;
                                } else {
                                    return 0;
                                }
                            })
                            .map(({location}) => ({
                                infos: {
                                    label: {value: location}
                                },
                                rightIcon: {
                                    color: 'primary',
                                    name: 'arrow-right.svg',
                                },
                                pressAction: () => {
                                    this.selectLocation({label: location}, this.missionFilter);
                                }
                            }));
                    } else { // if (this.currentPageMode === PageMode.MISSIONS) {
                        this.locationsListItemBody = [];
                        this.missionsListItemBody = inventoryMissions
                            .map(({id, mission_name, mission_start, mission_end, type}) => {
                                const logisticUnits = inventoryArticles
                                    .filter((article) => article.logistic_unit_code)
                                    .map((article) => article.logistic_unit_code)
                                    .filter((article1, article2, articles) => articles.indexOf(article1) === article2);

                                const nbLogisticUnits = logisticUnits.length;

                                const notUniqueReferences = inventoryArticles
                                    .filter(({mission_id: missionIdArt, is_ref}) => missionIdArt === id && is_ref === 0)
                                    .map(line => line.reference);

                                const nbRefFromArtInMission = notUniqueReferences
                                    .filter((reference, index, self) => self.indexOf(reference) === index)
                                    .length;

                                const nbRefInMission = nbRefFromArtInMission + inventoryArticles
                                    .filter(({mission_id: missionIdArt, is_ref}) => missionIdArt === id && is_ref === 1)
                                    .length;

                                const nbArtInMission = inventoryArticles
                                    .filter(({mission_id: missionIdArt, is_ref}) => missionIdArt === id && is_ref === 0)
                                    .length;

                                return {
                                    infos: {
                                        name_mission: {value: mission_name},
                                        date: {value: `Du ${moment(mission_start).format('DD/MM/YYYY')} au ${moment(mission_end).format('DD/MM/YYYY')}`},
                                        ...(type === 'article' ? {
                                            details: {
                                                value: `
                                                ${nbLogisticUnits} unité(s) logistique(s),
                                                ${nbRefInMission} référence${nbRefInMission > 1 ? 's' : ''},
                                                ${nbArtInMission} article${nbArtInMission > 1 ? 's' : ''},
                                            `
                                            }
                                        } : {})
                                    },
                                    rightIcon: {
                                        color: 'primary',
                                        name: 'arrow-right.svg',
                                    },
                                    pressAction: () => {
                                        this.selectMission(id, type);
                                    },
                                    badge: {
                                        label: type,
                                        color: {
                                            background: `#CBCBCB`,
                                            font: `#666666`,
                                        },
                                        inline: true
                                    }
                                };
                            });
                    }

                    this.mainHeaderService.emitSubTitle(this.pageSubtitle);

                    res.next();
                },
                error: (err) => {
                    res.error(err);
                }
            });
        return res;
    }

    private get pageSubtitle(): string {
        let subtitle: string|undefined;
        if (this.currentPageMode === PageMode.LOCATIONS) {
            subtitle = this.locationsListItemBody && this.locationsListItemBody.length > 0
                ? `${this.locationsListItemBody.length} emplacement${this.locationsListItemBody.length > 1 ? 's' : ''}`
                : undefined;
        }
        else { // if (this.currentPageMode === PageMode.MISSIONS)
            subtitle = this.missionsListItemBody && this.missionsListItemBody.length > 0
                ? `${this.missionsListItemBody.length} mission${this.missionsListItemBody.length > 1 ? 's' : ''}`
                : undefined;
        }
        return subtitle
            || (this.anomalyMode ? 'Toutes les anomalies ont été traitées' : 'Tous les inventaires sont à jour');
    }
}
