import {Component, ViewChild} from '@angular/core';
import {BarcodeScannerModeEnum} from '@common/components/barcode-scanner/barcode-scanner-mode.enum';
import {Anomalie} from '@entities/anomalie';
import {ArticleInventaire} from '@entities/article-inventaire';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {NavService} from '@app/services/nav/nav.service';
import {LoadingService} from '@app/services/loading.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {MainHeaderService} from '@app/services/main-header.service';
import {ToastService} from '@app/services/toast.service';
import {from, Observable, of, ReplaySubject, Subscription, zip} from 'rxjs';
import {mergeMap} from 'rxjs/operators';
import {SaisieInventaire} from '@entities/saisie-inventaire';
import * as moment from 'moment';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {SelectItemTypeEnum} from '@common/components/select-item/select-item-type.enum';
import {SelectItemComponent} from '@common/components/select-item/select-item.component';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";
import {IconConfig} from "@common/components/panel/model/icon-config";


@Component({
    selector: 'wii-inventory-articles',
    templateUrl: './inventory-articles.page.html',
    styleUrls: ['./inventory-articles.page.scss'],
})
export class InventoryArticlesPage implements ViewWillEnter, ViewWillLeave, CanLeave {

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public readonly scannerMode = BarcodeScannerModeEnum.TOOL_SEARCH;
    public selectItemType: SelectItemTypeEnum;
    public iconConfig?: IconConfig;
    public titleConfig?: string;
    public logisticUnit?: string;
    public dataSubscription?: Subscription;
    public validateSubscription?: Subscription;
    public resetEmitter$: ReplaySubject<void>;
    public listBoldValues?: Array<string>;
    public subtitleConfig?: string;
    public requestParams: Array<string>;
    public barcodeValidator = (barcode: string) => this.validateBarcode(barcode);

    public selectedLocation: string;
    public mission?: number;
    public articles: Array<ArticleInventaire>;
    public suggestionListConfig: Array<Array<{
        name: string;
        value: string;
    }>>;

    private anomalyMode: boolean;

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private localDataManager: LocalDataManagerService,
                       private mainHeaderService: MainHeaderService,
                       private toastService: ToastService,
                       private navService: NavService) {
        this.resetEmitter$ = new ReplaySubject<void>(1);
    }

    public ionViewWillEnter(): void {
        this.selectedLocation = this.navService.param('selectedLocation');
        this.anomalyMode = this.navService.param('anomalyMode') || false;
        this.mission = this.navService.param('mission') || undefined;
        this.initRegularView();
        if (this.selectItemComponent) {
            this.selectItemComponent.fireZebraScan();
        }
    }

    public ionViewWillLeave(): void {
        this.resetEmitter$.next();
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
    }

    public wiiCanLeave(): boolean {
        return !this.dataSubscription && !this.validateSubscription;
    }

    public initRegularView() {
        this.subtitleConfig = this.selectedLocation;
        this.listBoldValues = ['reference', 'barCode'];
        this.iconConfig = {name: 'inventory.svg'};
        this.titleConfig = 'Emplacement';
        this.logisticUnit = undefined;
        this.resetEmitter$.next();

        this.requestParams = [`location = '${this.selectedLocation}'`];
        if (this.anomalyMode) {
            this.requestParams.push(`treated IS NULL`);
        }

        if (this.mission) {
            this.requestParams.push(`mission_id = ${this.mission}`)
        }

        this.selectItemType = this.anomalyMode
            ? SelectItemTypeEnum.INVENTORY_ANOMALIES_ARTICLE
            : SelectItemTypeEnum.INVENTORY_ARTICLE;

        this.refreshList();
    }

    public refreshList() {
        if (!this.dataSubscription) {
            const table = this.anomalyMode
                ? 'anomalie_inventaire'
                : 'inventory_item';
            this.dataSubscription = this.loadingService
                .presentLoading('Chargement...')
                .pipe(
                    mergeMap((loader) => from(loader.dismiss())),
                    mergeMap(() => this.sqliteService.findBy(table, this.requestParams))
                )
                .subscribe((articlesFromDB) => {
                    this.articles = articlesFromDB;
                    this.refreshSubTitle();
                    // this map creates an array with unique logistic unit code
                    const logisticUnitsUnique: Array<ArticleInventaire> = [];
                    articlesFromDB
                        .filter((article) => article.logistic_unit_code)
                        .forEach((article) => {
                            if (!logisticUnitsUnique.some((articleToTest) => articleToTest.logistic_unit_code === article.logistic_unit_code)) {
                                logisticUnitsUnique.push(article);
                            }
                        })
                    const articlesWithoutLU = this.articles.filter((article) => !article.logistic_unit_code) as any;
                    const iterator = articlesWithoutLU
                        .concat(logisticUnitsUnique)
                        // @ts-ignore
                        .sort((article1?: ArticleInventaire, article2?: ArticleInventaire) => (
                            article1 === undefined ? 1
                            : article2 === undefined ? -1
                            // @ts-ignore
                            : (article1?.logistic_unit_code < article2?.logistic_unit_code) ? -1
                            // @ts-ignore
                            : (article1?.logistic_unit_code > article2?.logistic_unit_code) ? 1
                            : 0
                        ));
                    if (this.logisticUnit && this.articles.some((articleToTest) => articleToTest.logistic_unit_code === this.logisticUnit)) {
                        this.initLogisticView(this.logisticUnit);
                    } else {
                        this.suggestionListConfig = iterator.map((article: any) => {
                            return [{
                                name: article.logistic_unit_code ? `Unité logistique` : 'Référence',
                                value: article.logistic_unit_code || article.reference
                            }, {
                                name: article.logistic_unit_code ? `Nature` : 'Code barre',
                                value: article.logistic_unit_code ? article.logistic_unit_nature : article.barcode
                            }]
                        });
                    }
                    this.unsubscribeData();
                });
        }
    }

    public initLogisticView(logisticUnit?: string) {
        this.suggestionListConfig = this.articles
            .filter((article) => article.logistic_unit_code === logisticUnit)
            .map((article: any) => {
                return [{
                    name: 'Référence',
                    value: article.reference
                }, {
                    name:'Code barre',
                    value: article.barcode
                }]
            });
        this.titleConfig = 'Unité logistique';
        this.iconConfig = {name: 'logistic-unit.svg'};
        this.logisticUnit = logisticUnit;
        this.subtitleConfig = logisticUnit;
        this.requestParams.push(`logistic_unit_code = '${logisticUnit}'`);
        this.selectItemComponent.reload().subscribe(() => {
            this.refreshSubTitle();
        });
    }

    public navigateToInventoryValidate(selectedArticle: ArticleInventaire & Anomalie): void {
        const self = this;
        this.selectItemComponent.closeSearch();
        if (selectedArticle.logistic_unit_code && !this.logisticUnit) {
            this.initLogisticView(selectedArticle.logistic_unit_code);
        } else {
            this.navService.push(NavPathEnum.INVENTORY_VALIDATE, {
                selectedArticle,
                remainingArticles: 0,
                validateQuantity: (quantity: number) => {
                    if (!this.validateSubscription) {
                        if (!this.anomalyMode
                            || selectedArticle.is_treatable
                            || selectedArticle.quantity === quantity) {
                            this.validateSubscription = zip(
                                this.loadingService.presentLoading('Chargement...'),
                                self.validateQuantity(selectedArticle, quantity)
                            )
                                .pipe(
                                    mergeMap(([loader]) => zip(
                                        of(loader),
                                        this.localDataManager.sendFinishedProcess(this.anomalyMode ? 'inventoryAnomalies' : 'inventory')
                                    )),
                                    mergeMap(([loader, resApi]: [HTMLIonLoadingElement, any]) => zip(
                                        of(loader),
                                        this.selectItemComponent.searchComponent.reload(),
                                        ((resApi && resApi.success && resApi.data && resApi.data.status)
                                            ? this.toastService.presentToast(resApi.data.status, {duration: ToastService.LONG_DURATION})
                                            : of(undefined))
                                    )),
                                    mergeMap(([loader]) => from(loader.dismiss()))
                                )
                                .subscribe(() => {
                                    this.unsubscribeValidate();
                                    if (this.selectItemComponent.dbItemsLength === 0) {
                                        this.navService.pop();
                                    } else {
                                        this.refreshSubTitle();
                                        this.logisticUnit = selectedArticle.logistic_unit_code;
                                        if (this.logisticUnit && this.articles.some((articleToTest) => articleToTest.logistic_unit_code === this.logisticUnit)) {
                                            this.initLogisticView(this.logisticUnit);
                                        } else {
                                            this.initRegularView();
                                        }
                                    }
                                });
                        } else {
                            this.toastService.presentToast('Du stock en transit existe sur ' + (selectedArticle.is_ref ? 'la référence ' : 'l\'article ') + selectedArticle.barcode + ', l\'anomalie ne peut être validée.', {duration: ToastService.LONG_DURATION});
                        }
                    }
                }
            });
        }
    }

    public refreshSubTitle(): void {
        const nbLogisticUnits = this.articles
            .filter((article) => article.logistic_unit_code)
            .length;

        const nbRefInMission = this.articles
            .filter(({is_ref}) =>  is_ref === 1)
            .length;

        const nbArtInMission = this.articles
            .filter(({is_ref}) => is_ref === 0)
            .length;

        this.mainHeaderService.emitSubTitle(this.articles.length === 0
            ? 'Les inventaires pour cet emplacements sont à jour'
            : `
                ${nbLogisticUnits} unité${nbLogisticUnits > 1 ? 's' : ''} logistique${nbLogisticUnits > 1 ? 's' : ''},
                ${nbRefInMission} référence${nbRefInMission > 1 ? 's' : ''} et
                ${nbArtInMission} article${nbArtInMission > 1 ? 's' : ''}
            `);
    }

    public validateQuantity(selectedArticle: ArticleInventaire&Anomalie, quantity: number): Observable<any> {
        if (this.anomalyMode) {
            return this.sqliteService.update('anomalie_inventaire', [{values: {quantity, treated: '1'}, where: [`id = ${selectedArticle.id}`]}]);
        }
        else {
            const saisieInventaire: SaisieInventaire = {
                id: null,
                mission_id: selectedArticle.mission_id,
                date: moment().format(),
                bar_code: selectedArticle.barcode,
                is_ref: selectedArticle.is_ref,
                quantity,
                location: selectedArticle.location,
            };

            return zip(
                this.sqliteService.insert('saisie_inventaire', saisieInventaire),
                this.sqliteService.deleteBy('inventory_item', [`id = ${selectedArticle.id}`])
            );
        }
    }

    private unsubscribeData(): void {
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
            this.dataSubscription = undefined;
        }
    }

    private unsubscribeValidate(): void {
        if (this.validateSubscription) {
            this.validateSubscription.unsubscribe();
            this.validateSubscription = undefined;
        }
    }

    public validateBarcode(barcode: string): Observable<ArticleInventaire|undefined> {
        return this.loadingService
            .presentLoadingWhile({
                event: () => {
                    let articles = this.articles.filter((article) => article.barcode === barcode);
                    if (articles.length) {
                        return of(articles[0]);
                    }
                    articles = this.articles.filter((article) => article.logistic_unit_code === barcode);
                    if (articles.length) {
                        return of(articles[0]);
                    }
                    return of(undefined);
                }
            });
    }
}
