import {Component, EventEmitter, ViewChild} from '@angular/core';
import {SelectItemComponent} from '@common/components/select-item/select-item.component';
import {SelectItemTypeEnum} from '@common/components/select-item/select-item-type.enum';
import {BarcodeScannerModeEnum} from '@common/components/barcode-scanner/barcode-scanner-mode.enum';
import {ArticlePrepa} from '@entities/article-prepa';
import {Observable, of, Subscription, zip} from 'rxjs';
import {NavService} from '@app/services/nav/nav.service';
import {ToastService} from '@app/services/toast.service';
import {LoadingService} from '@app/services/loading.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {StorageService} from '@app/services/storage/storage.service';
import {ArticlePrepaByRefArticle} from '@entities/article-prepa-by-ref-article';
import {IconConfig} from '@common/components/panel/model/icon-config';
import {map, mergeMap} from 'rxjs/operators';
import {IonInfiniteScroll, ViewWillEnter, ViewWillLeave} from '@ionic/angular';
import {NavParams} from "@app/services/nav/nav-params";


@Component({
    selector: 'wii-preparation-ref-articles',
    templateUrl: './preparation-ref-articles.page.html',
    styleUrls: ['./preparation-ref-articles.page.scss'],
})
export class PreparationRefArticlesPage implements ViewWillEnter, ViewWillLeave, CanLeave {

    private static readonly SUGGESTING_LIST_LIMIT: number = 15;

    @ViewChild('infiniteScroll', {static: false})
    public infiniteScroll: IonInfiniteScroll;

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public readonly selectItemType = SelectItemTypeEnum.ARTICLE_TO_PICK;
    public scannerMode = BarcodeScannerModeEnum.ONLY_SCAN;
    public listWhereClause: Array<string>;
    public refArticle: ArticlePrepa;
    public suggestingArticleList: Array<ArticlePrepaByRefArticle> = [];

    public loading: boolean;

    public resetEmitter$: EventEmitter<void>;

    private pageHasLoadedOnce: boolean;
    private countSubscription?: Subscription;
    private loadMoreSubscription?: Subscription;
    private navParams: NavParams;

    public parameterSkipQuantities: boolean = false;
    public parameterWithoutManual: boolean = false;

    private suggestingListOffset: number = 0;

    public panelHeaderConfig: {
        title: string;
        leftIcon: IconConfig;
        transparent: boolean;
    };

    public suggestionListConfig: Array<Array<{
        name: string;
        value: string|number;
    }>>;

    public constructor(private toastService: ToastService,
                       private loadingService: LoadingService,
                       private sqliteService: SqliteService,
                       private storageService: StorageService,
                       private navService: NavService) {
        this.loading = true;
        this.pageHasLoadedOnce = false;
        this.resetEmitter$ = new EventEmitter<void>();
    }

    public wiiCanLeave(): boolean {
        return !this.loading;
    }

    public ionViewWillEnter(): void {
        if (this.navService.popItem
            && this.navService.popItem.path !== NavPathEnum.PREPARATION_REF_ARTICLES) {
            return;
        }

        this.resetEmitter$.emit();
        if (!this.pageHasLoadedOnce) {
            this.loading = true;
            this.pageHasLoadedOnce = true;
            this.navParams = this.navService.params();
            this.refArticle = this.navParams.article;
            this.listWhereClause = [`reference_barCode LIKE '${this.refArticle.barcode}'`];

            this.countSubscription = this.loadingService
                .presentLoadingWhile({
                    event: () => zip(
                        this.storageService.getRight(StorageKeyEnum.PARAMETER_PREPARATION_DISPLAY_ARTICLE_WITHOUT_MANUAL),
                        this.storageService.getRight(StorageKeyEnum.PARAMETER_SKIP_QUANTITIES_PREPARATIONS),
                        this.sqliteService.count('article_prepa_by_ref_article', this.listWhereClause),
                    ).pipe(
                        mergeMap(([withoutManual, ...other]) => {
                            return this.findSuggestingArticleList(withoutManual).pipe(map((suggestingArticleList) => [
                                withoutManual,
                                ...other,
                                suggestingArticleList
                            ]))
                        })
                    )
                })
                .subscribe(([withoutManual, skipQuantities, counter, suggestingArticleList]) => {
                    this.loading = false;
                    this.parameterSkipQuantities = skipQuantities as boolean;
                    this.parameterWithoutManual = withoutManual as boolean;
                    this.suggestingArticleList = suggestingArticleList as Array<ArticlePrepaByRefArticle>;
                    this.suggestingListOffset = PreparationRefArticlesPage.SUGGESTING_LIST_LIMIT;

                    this.panelHeaderConfig = {
                        title: withoutManual ? 'Flasher un article' : 'Sélectionner un article',
                        transparent: true,
                        leftIcon: {
                            name: 'preparation.svg'
                        }
                    };

                    this.suggestionListConfig = this.suggestingArticleList.map((preparationArticle: ArticlePrepaByRefArticle) => {
                        return [
                            {
                                name: `Article`,
                                value: preparationArticle.barcode || ''
                            },
                            ...(preparationArticle.location !== `null`
                                ? [{
                                    name: `Emplacement`,
                                    value: preparationArticle.location || ''
                                }]
                                : []),
                            ...(preparationArticle.quantity
                                ? [{
                                    name: `Quantité restante`,
                                    value: preparationArticle.quantity || ''
                                }]
                                : []),
                            ...(preparationArticle.management
                                ? [{
                                    name: (preparationArticle.management === `FIFO`
                                        ? `Date d'entrée en stock`
                                        : (preparationArticle.management === `FEFO`
                                            ? `Date d'expiration`
                                            : 'Date')),
                                    value: preparationArticle.management_date || ''
                                }]
                                : [])
                        ]
                    });

                    this.scannerMode = this.parameterWithoutManual ? BarcodeScannerModeEnum.ONLY_SCAN : BarcodeScannerModeEnum.TOOL_SEARCH;
                    if (!counter || counter <= 0) {
                        this.toastService.presentToast('Aucun article trouvé...');
                        this.navService.pop();
                    }

                    else if (this.selectItemComponent) {
                        this.selectItemComponent.fireZebraScan();
                    }
                });
        }
    }

    public ionViewWillLeave(): void {
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
        if (this.countSubscription) {
            this.countSubscription.unsubscribe();
            this.countSubscription = undefined;
        }
        this.unsubscribeLoadMore();
    }

    public selectArticle(selectedArticle: ArticlePrepaByRefArticle): void {
        if (this.parameterSkipQuantities) {
            this.navService.pop().subscribe(() => {
                this.navParams.selectArticle(Math.min(selectedArticle.quantity, this.refArticle.quantite), selectedArticle);
            });
        }
        else {
            this.navService.push(NavPathEnum.PREPARATION_ARTICLE_TAKE, {
                article: selectedArticle,
                refArticle: this.refArticle,
                preparation: this.navParams.preparation,
                started: this.navParams.started,
                valid: this.navParams.valid,
                selectArticle: (selectedQuantity: number) => {
                    this.navParams.selectArticle(selectedQuantity, selectedArticle);
                }
            });
        }
    }

    private findSuggestingArticleList(withoutManual: boolean): Observable<Array<ArticlePrepaByRefArticle>> {
        return withoutManual
            ? this.sqliteService.findBy(
                'article_prepa_by_ref_article',
                this.listWhereClause || [],
                {
                    'pickingPriority': 'DESC',
                    'management_order IS NULL': 'ASC', // put null at the end
                    'management_order': 'ASC'
                },
                {
                    limit: PreparationRefArticlesPage.SUGGESTING_LIST_LIMIT,
                    offset: this.suggestingListOffset
                }
            )
            : of([]);
    }

    public loadMore(infiniteScroll: IonInfiniteScroll): void {
        this.unsubscribeLoadMore();
        this.loadMoreSubscription = this.findSuggestingArticleList(this.parameterWithoutManual)
            .subscribe((following: Array<ArticlePrepaByRefArticle>) => {
                infiniteScroll.complete();
                if (following.length > 0) {
                    this.suggestingArticleList = [
                        ...this.suggestingArticleList,
                        ...following
                    ];
                    this.suggestingListOffset += PreparationRefArticlesPage.SUGGESTING_LIST_LIMIT;
                }
                else {
                    infiniteScroll.disabled = true;
                }
            });
    }

    public unsubscribeLoadMore() {
        if (this.loadMoreSubscription && !this.loadMoreSubscription.closed) {
            this.loadMoreSubscription.unsubscribe();
        }
        this.loadMoreSubscription = undefined;
    }
}
