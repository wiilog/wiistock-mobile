import {Component, ViewChild} from '@angular/core';
import {Livraison} from '@entities/livraison';
import {BarcodeScannerComponent} from '@common/components/barcode-scanner/barcode-scanner.component';
import {ArticleLivraison} from '@entities/article-livraison';
import {HeaderConfig} from '@common/components/panel/model/header-config';
import {ListPanelItemConfig} from '@common/components/panel/model/list-panel/list-panel-item-config';
import {IconConfig} from '@common/components/panel/model/icon-config';
import {ToastService} from '@app/services/toast.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {ApiService} from '@app/services/api.service';
import {NavService} from '@app/services/nav/nav.service';
import {map, mergeMap, tap} from 'rxjs/operators';
import * as moment from 'moment';
import {Mouvement} from '@entities/mouvement';
import {IconColor} from '@common/components/icon/icon-color';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {NetworkService} from '@app/services/network.service';
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {StorageService} from "@app/services/storage/storage.service";
import {StorageKeyEnum} from "@app/services/storage/storage-key.enum";
import {Observable, of, zip} from "rxjs";
import {AlertService} from "@app/services/alert.service";
import {Nature} from "@entities/nature";
import {LoadingService} from "@app/services/loading.service";
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";


@Component({
    selector: 'wii-livraison-articles',
    templateUrl: './livraison-articles.page.html',
    styleUrls: ['./livraison-articles.page.scss'],
})
export class LivraisonArticlesPage implements ViewWillEnter, ViewWillLeave {
    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public livraison: Livraison;

    public articlesNT: Array<ArticleLivraison>;
    public articlesT: Array<ArticleLivraison>;
    public articles: Array<ArticleLivraison>;

    public numberArticlesInLU?: any;

    public listBoldValues?: Array<string>;
    public listToTreatConfig?: { header: HeaderConfig; body: Array<ListPanelItemConfig>; };
    public listTreatedConfig?: { header: HeaderConfig; body: Array<ListPanelItemConfig>; };
    public livraisonsHeaderConfig?: {
        leftIcon: IconConfig;
        title: string;
        subtitle?: Array<string>;
        info?: string;
    };

    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.INVISIBLE;

    public started: boolean = false;
    public isValid: boolean = true;
    public skipValidation: boolean = false;
    public skipQuantities: boolean = false;
    public loadingStartLivraison: boolean;
    public displayTargetLocationPicking: boolean = false;

    public constructor(private toastService: ToastService,
                       private sqliteService: SqliteService,
                       private networkService: NetworkService,
                       private apiService: ApiService,
                       private storageService: StorageService,
                       private alertService: AlertService,
                       private navService: NavService,
                       private loadingService: LoadingService) {
        this.loadingStartLivraison = false;
    }

    public ionViewWillEnter(): void {
        this.livraison = this.navService.param('livraison');

        this.livraisonsHeaderConfig = {
            leftIcon: {name: 'delivery.svg'},
            title: `Livraison ${this.livraison.number}`,
            subtitle: [
                `Destination : ${this.livraison.location}`,
                ...(this.livraison.comment ? [`Commentaire : ${this.livraison.comment}`] : [])
            ]
        };

        this.listBoldValues = ['label', 'barCode', 'location', 'quantity', 'targetLocationPicking', 'logisticUnit', 'articlesCount', 'nature'];

        if (this.footerScannerComponent) {
            this.footerScannerComponent.fireZebraScan();
        }

        this.loadingService
            .presentLoadingWhile({
                message: 'Récupération des données en cours...' ,
                event: () => {
                    return this.apiService.requestApi(ApiService.CHECK_DELIVERY_LOGISTIC_UNIT_CONTENT, {params: {livraisonId: this.livraison.id}})
            }}
        ).subscribe((data) => {
            this.numberArticlesInLU = data.numberArticlesInLU;
            zip(
                this.sqliteService.findBy('article_livraison', [`id_livraison = ${this.livraison.id}`]),
                this.storageService.getRight(StorageKeyEnum.PARAMETER_SKIP_VALIDATION_DELIVERY),
                this.storageService.getRight(StorageKeyEnum.PARAMETER_SKIP_QUANTITIES_DELIVERY),
                this.storageService.getRight(StorageKeyEnum.PARAMETER_DISPLAY_TARGET_LOCATION_PICKING)
            ).subscribe(([articles, skipValidation, skipQuantities, displayTargetLocationPicking]: [Array<ArticleLivraison>, boolean, boolean, boolean]) => {
                this.skipValidation = skipValidation;
                this.skipQuantities = skipQuantities;
                this.displayTargetLocationPicking = displayTargetLocationPicking;
                this.articles = articles;

                this.updateList(articles, true);
                if (this.articlesT.length > 0) {
                    this.started = true;
                }
            })
        });
    }

    public ionViewWillLeave(): void {
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    public async selectArticle(article: any, deliveredQuantity?: number) {
        const articles = Array.isArray(article) ? article : [article];
        const hasNetwork = await this.networkService.hasNetwork();
        if (!this.started && hasNetwork) {
            this.loadingStartLivraison = true;
            this.loadingService.presentLoadingWhile({
                event: () => (
                    this.apiService
                        .requestApi(ApiService.BEGIN_LIVRAISON, {params: {id: this.livraison.id}}))
                        .pipe(
                            mergeMap((resp) => {
                                if (resp.success) {
                                    this.started = true;
                                    this.isValid = true;
                                    return zip(
                                        ...articles
                                            .map((article: ArticleLivraison) => this.registerMvt(article, deliveredQuantity || article.quantity))
                                    ).pipe(
                                        mergeMap(() => this.sqliteService.findBy('article_livraison', [`id_livraison = ${this.livraison.id}`])),
                                        tap((articles) => this.updateList(articles)),
                                        map(() => `Livraison commencée.`))
                                } else {
                                    this.isValid = false;
                                    this.loadingStartLivraison = false;
                                    return of(resp.msg);
                                }
                            })
                ),
            }).subscribe((resp) => {
                this.toastService.presentToast(resp);
            });
        } else {
            if (!this.networkService.hasNetwork()) {
                this.toastService.presentToast('Livraison commencée en mode hors ligne.');
            }

            this.loadingService.presentLoadingWhile({
                event: () => zip(
                    ...articles
                        .map((article: ArticleLivraison) => this.registerMvt(article, deliveredQuantity || article.quantity))
                ).pipe(
                    mergeMap(() => this.sqliteService.findBy('article_livraison', [`id_livraison = ${this.livraison.id}`])))
            }).subscribe((articles) => {
                this.updateList(articles);
            });
        }
    }

    public refreshOver(): void {
        this.toastService.presentToast('Livraison prête à être finalisée.').subscribe(() => {
            if (this.skipValidation) {
                this.validate();
            }
        })
    }

    public refresh(): void {
        this.toastService.presentToast('Quantité bien prélevée.')
    }

    public registerMvt(article: any, quantity: any): Observable<any> {
        if (this.isValid) {
            if (article.quantity !== Number(quantity)) {
                let newArticle: ArticleLivraison = {
                    id: null,
                    label: article.label,
                    reference: article.reference,
                    quantity: Number(quantity),
                    is_ref: article.is_ref,
                    id_livraison: article.id_livraison,
                    has_moved: 1,
                    location: article.location,
                    barcode: article.barcode,
                    targetLocationPicking: article.targetLocationPicking
                };
                let articleAlready = this.articlesT.find(art => art.id_livraison === newArticle.id_livraison && art.is_ref === newArticle.is_ref && art.reference === newArticle.reference);
                if (articleAlready !== undefined) {
                    return this.sqliteService
                        .update('article_livraison', [{
                            values: {quantity: newArticle.quantity + articleAlready.quantity},
                            where: [`id = ${articleAlready.id}`]
                        }])
                        .pipe(
                            mergeMap(() => this.sqliteService.update('article_livraison', [{
                                values: {quantity: article.quantity - newArticle.quantity},
                                where: [`id = ${article.id}`]
                            }])),
                        );
                } else {
                    return this.sqliteService.insert('article_livraison', newArticle)
                        .pipe(
                            mergeMap((insertId) => this.sqliteService.insert('mouvement', {
                                id: null,
                                reference: newArticle.reference,
                                quantity: article.quantity,
                                date_pickup: moment().format(),
                                location_from: newArticle.location,
                                date_drop: null,
                                location: null,
                                type: 'prise-dépose',
                                is_ref: newArticle.is_ref,
                                id_article_prepa: null,
                                id_prepa: null,
                                id_article_livraison: insertId,
                                id_livraison: newArticle.id_livraison,
                                id_article_collecte: null,
                                id_collecte: null,
                            })),
                            mergeMap(() => this.sqliteService
                                .update('article_livraison', [{
                                    values: {quantity: article.quantity - Number(quantity)},
                                    where: [`id = ${article.id}`]
                                }])),
                            mergeMap((mouvement: Mouvement) => this.sqliteService.insert('mouvement', mouvement)))
                }
            } else {
                let mouvement: Mouvement = {
                    id: null,
                    reference: article.reference,
                    quantity: article.quantity,
                    date_pickup: moment().format(),
                    location_from: article.location,
                    date_drop: null,
                    location: null,
                    type: 'prise-dépose',
                    is_ref: article.is_ref,
                    id_article_prepa: null,
                    id_prepa: null,
                    id_article_livraison: article.id,
                    id_livraison: article.id_livraison,
                    id_article_collecte: null,
                    id_collecte: null,
                };
                let articleAlready = this.articlesT.find(art => art.id_livraison === mouvement.id_livraison && art.is_ref === mouvement.is_ref && art.reference === mouvement.reference);
                if (articleAlready !== undefined) {
                    return this.sqliteService
                        .update('article_livraison', [{
                            values: {quantity: mouvement.quantity + articleAlready.quantity},
                            where: [`id = ${articleAlready.id}`]
                        }])
                        .pipe(
                            mergeMap(() => this.sqliteService.deleteBy('article_livraison', [`id = ${mouvement.id_article_livraison}`])),
                        );
                } else {
                    return this.sqliteService
                        .insert('mouvement', mouvement)
                        .pipe(
                            mergeMap(() => this.sqliteService.moveArticleLivraison(article.id))
                        );
                }
            }
        } else {
            return of(undefined);
        }
    }

    public validate(): void {
        if ((this.articlesNT.length > 0) ||
            (this.articlesT.length === 0)) {
            this.toastService.presentToast('Veuillez traiter tous les articles concernés');
        } else {
            this.navService.push(NavPathEnum.LIVRAISON_EMPLACEMENT, {
                livraison: this.livraison,
                validateLivraison: () => {
                    this.navService.pop();
                }
            });
        }
    }

    public redirectToDeposeOrUlAssociation(redirectionRoute: NavPathEnum,
                                           livraisonToRedirect: Livraison,
                                           articles: Array<{barcode: string; reference: string; label: string; quantity: number; location: string; currentLogisticUnitCode: string}>): void {
        let articlesList: any = [];
        const date = moment().format();
        if (redirectionRoute === NavPathEnum.EMPLACEMENT_SCAN){
            articlesList = articles.map((article) => ({
                ref_article: article.barcode,
                quantity: article.quantity,
                date,
            }));
        } else if(redirectionRoute === NavPathEnum.ASSOCIATION) {
            articlesList = articles.map((article) => ({
                barCode: article.barcode,
                label: article.label,
                quantity: article.quantity,
                location: article.location,
                reference: article.reference,
                ref_article: article.reference,
                currentLogisticUnitCode: article.currentLogisticUnitCode,
                is_lu: false,
                date
            }));
        }
        this.navService.pop().subscribe(() => {
            this.navService.push(redirectionRoute, {
                articlesList,
                livraisonToRedirect,
                fromStock: false,
                fromStockLivraison: true,
                fromDepose: true,
                createTakeAndDrop: true
            });
        });
    }

    public testIfBarcodeEquals(text: any, fromText: boolean = true): void {
        const logisticUnits = (articles: Array<ArticleLivraison>) => (
            (articles
                .filter((article: ArticleLivraison) => article.currentLogisticUnitCode)
                .map((article: ArticleLivraison) => article.currentLogisticUnitCode) as Array<string>)
                .filter((code: string, index: number, logisticUnitCodes: Array<string>) => index === logisticUnitCodes.indexOf(code))
        );

        const logisticUnit = logisticUnits(this.articlesNT).find((logisticUnit: string) => logisticUnit === text);

        const article = fromText
            ? this.articlesNT.find((article) => (article.barcode === text))
            : text;

        if (article && article.currentLogisticUnitId) {
            this.toastService.presentToast(`Cet article est présent dans l'unité logistique <strong>${article.currentLogisticUnitCode}</strong>, vous ne pouvez pas le livrer seul.`);
        } else {
            if (article || logisticUnit) {
                if (logisticUnit || this.skipQuantities) {
                    if (logisticUnit) {
                        const options = {
                            logisticUnit
                        };
                        this.loadingService.presentLoadingWhile({
                            event: () => this.apiService.requestApi(ApiService.CHECK_LOGISTIC_UNIT_CONTENT, {params: options}),
                            message: 'Chargement en cours...'
                        }).subscribe(({extraArticles}: any) => {
                            if (extraArticles.length > 0) {
                                this.openModalRemoveArticles(extraArticles)
                            } else {
                                const articles = this.articlesNT.filter((article: ArticleLivraison) => article.currentLogisticUnitCode === logisticUnit);
                                this.selectArticle(articles);
                            }
                        });
                    } else {
                        this.selectArticle(article);
                    }
                } else {
                    this.navService.push(NavPathEnum.LIVRAISON_ARTICLE_TAKE, {
                        article,
                        selectArticle: (quantity: any) => {
                            this.selectArticle(article, quantity);
                        }
                    });
                }
            } else {
                const treatedArticleIndex = this.articlesT.findIndex((article) => (article.barcode === text));
                const treatedLogisticUnitIndex = logisticUnits(this.articlesT).findIndex((logisticUnit: string) => logisticUnit === text);
                if(treatedArticleIndex !== -1 || treatedLogisticUnitIndex !== -1) {
                    this.toastService.presentToast(`L'objet <strong>${text}</strong> a déjà été scanné.`);
                } else {
                    this.toastService.presentToast(`L'objet <strong>${text}</strong> n'est pas dans la liste.`);
                }
            }
        }
    }

    public takeAll() {
        this.apiService
            .requestApi(ApiService.BEGIN_LIVRAISON, {params: {id: this.livraison.id}})
            .subscribe((resp) => {
                if (resp.success) {
                    this.started = true;
                    this.isValid = true;
                    this.toastService.presentToast('Livraison commencée.');
                    this.selectArticle(this.articlesNT);
                } else {
                    this.isValid = false;
                    this.loadingStartLivraison = false;
                    this.toastService.presentToast(resp.msg);
                }
            });
    }

    private createListToTreatConfig(): { header: HeaderConfig; body: Array<ListPanelItemConfig>; } | undefined {
        const articlesCount = this.articlesNT
            ? this.articlesNT.filter((article: ArticleLivraison) => !article.is_ref && !article.currentLogisticUnitId).length
            : 0;
        const referencesCount = this.articlesNT
            ? this.articlesNT.filter((article: ArticleLivraison) => article.is_ref).length
            : 0;
        const logisiticUnitsCount = this.articlesNT
            ? (this.articlesNT
                .filter((article: ArticleLivraison) => article.currentLogisticUnitId)
                .map((article: ArticleLivraison) => article.currentLogisticUnitId) as Array<number>)
                .filter((id: number, index, logisticUnitIds) => index === logisticUnitIds.indexOf(id))
                .length
            : 0;
        const articlesInLogisticUnitCount = this.articlesNT
            ? this.articlesNT
                .filter((article: ArticleLivraison) => article.currentLogisticUnitId)
                .length
            : 0;

        const content = [
            `${articlesCount} article${articlesCount > 1 ? 's' : ''} à scanner`,
            `${referencesCount} référence${referencesCount > 1 ? 's' : ''} à scanner`,
            `${logisiticUnitsCount} UL à scanner`,
            `${articlesInLogisticUnitCount} article${articlesInLogisticUnitCount > 1 ? 's' : ''} contenu${articlesInLogisticUnitCount > 1 ? 's' : ''}`
        ];

        return articlesCount > 0 || referencesCount > 0 || logisiticUnitsCount > 0 || articlesInLogisticUnitCount > 0
            ? {
                header: {
                    title: 'À livrer',
                    info: content.join(`, `),
                    leftIcon: {
                        name: 'download.svg',
                        color: 'list-yellow-light'
                    },
                    rightIconLayout: 'horizontal',
                    rightIcon: [
                        {
                            color: 'primary',
                            name: 'scan-photo.svg',
                            action: () => {
                                this.footerScannerComponent.scan();
                            }
                        },
                        ...(this.skipQuantities
                            ? [{
                                name: 'up.svg',
                                action: () => {
                                    this.takeAll()
                                },
                            }]
                            : [])
                    ]
                },
                body: this.getBodyConfig(this.articlesNT, true)
            }
            : undefined;
    }

    private createListTreatedConfig(): { header: HeaderConfig; body: Array<ListPanelItemConfig>; } {
        const articlesCount = this.articlesT
            ? this.articlesT.filter((article: ArticleLivraison) => !article.is_ref && !article.currentLogisticUnitId).length
            : 0;
        const referencesCount = this.articlesT
            ? this.articlesT.filter((article: ArticleLivraison) => article.is_ref).length
            : 0;
        const logisiticUnitsCount = this.articlesT
            ? (this.articlesT
                .filter((article: ArticleLivraison) => article.currentLogisticUnitId)
                .map((article: ArticleLivraison) => article.currentLogisticUnitId) as Array<number>)
                .filter((id: number, index, articleIds) => index === articleIds.indexOf(id))
                .length
            : 0;
        const articlesInLogisticUnitCount = this.articlesT
            ? this.articlesT
                .filter((article: ArticleLivraison) => article.currentLogisticUnitId)
                .length
            : 0;

        const content = [
            `${articlesCount} article${articlesCount > 1 ? 's' : ''} scanné${articlesCount > 1 ? 's' : ''}`,
            `${referencesCount} référence${referencesCount > 1 ? 's' : ''} scannée${referencesCount > 1 ? 's' : ''}`,
            `${logisiticUnitsCount} UL scannée${logisiticUnitsCount > 1 ? 's' : ''}`,
            `${articlesInLogisticUnitCount} article${articlesInLogisticUnitCount > 1 ? 's' : ''} contenu${articlesInLogisticUnitCount > 1 ? 's' : ''}`
        ];

        return {
            header: {
                title: 'Livré',
                info: `${content.join(', ')}`,
                leftIcon: {
                    name: 'upload.svg',
                    color: 'list-yellow'
                },
            },
            body: this.getBodyConfig(this.articlesT)
        };
    }

    private createArticleInfo({label, barcode, location, quantity, targetLocationPicking}: ArticleLivraison): { [name: string]: { label: string; value: string; } } {
        return {
            label: {
                label: 'Label',
                value: label
            },
            ...(
                barcode
                    ? {
                        barCode: {
                            label: 'Code barre',
                            value: barcode
                        }
                    }
                    : {}
            ),
            ...(
                location && location !== 'null'
                    ? {
                        location: {
                            label: 'Emplacement',
                            value: location
                        }
                    }
                    : {}
            ),
            ...(
                quantity
                    ? {
                        quantity: {
                            label: 'Quantité',
                            value: `${quantity}`
                        }
                    }
                    : {}
            ),
            ...(
                this.displayTargetLocationPicking
                    ? {
                        targetLocationPicking: {
                            label: 'Emplacement cible picking',
                            value: `${targetLocationPicking || '-'}`
                        }
                    }
                    : {}
            )
        };
    }

    private updateList(articles: Array<ArticleLivraison>, isInit: boolean = false): void {
        this.articlesNT = articles.filter(({has_moved}) => (has_moved === 0));
        this.articlesT = articles.filter(({has_moved}) => (has_moved === 1));

        this.listToTreatConfig = this.createListToTreatConfig();
        this.listTreatedConfig = this.createListTreatedConfig();

        if (!isInit) {
            if (this.articlesNT.length === 0) {
                this.refreshOver();
            } else {
                this.refresh();
            }
            this.loadingStartLivraison = false;
        }
    }

    /* TODO WIIS-7970 refaire */
    private getBodyConfig(articles: Array<ArticleLivraison>, notTreatedList: boolean = false) {
        const groupedArticlesByLogisticUnit = articles
            .reduce((acc, article) => {
                // @ts-ignore
                (acc[article['currentLogisticUnitCode']] = acc[article['currentLogisticUnitCode']] || []).push(article);
                return acc;
            }, {});

        // @ts-ignore
        let bodyConfig = [];
        Object.keys(groupedArticlesByLogisticUnit).map((logisticUnit?: string) => {
            // @ts-ignore
            const articles = groupedArticlesByLogisticUnit[logisticUnit];

            if (logisticUnit !== `null`) {
                const firstArticle = articles[0];

                this.sqliteService.findOneBy(`nature`, {id: firstArticle.currentLogisticUnitNatureId})
                    .subscribe((nature: Nature) => {
                        bodyConfig.push({
                            // @ts-ignore
                            infos: this.createLogisticUnitInfo(articles, logisticUnit, nature ? nature.label : undefined, firstArticle.currentLogisticUnitLocation),
                            ...nature ? ({
                                color: nature.color
                            }) : {},
                            ...notTreatedList ? ({
                                rightIcon: {
                                    color: 'grey' as IconColor,
                                    name: 'up.svg',
                                    action: () => {
                                        this.testIfBarcodeEquals(logisticUnit, false)
                                    }
                                },
                                // @ts-ignore
                                pressAction: () => this.showLogisticUnitContent(articles, logisticUnit)
                            }) : {
                                rightIcon: {
                                    name: 'trash.svg',
                                    color: 'danger' as IconColor,
                                    action: () => {
                                        articles
                                            // @ts-ignore
                                            .filter((article) => article.currentLogisticUnitCode === logisticUnit)
                                            // @ts-ignore
                                            .forEach((article) => article.has_moved = 0);
                                        this.updateList(articles)
                                    }
                                }
                            },
                        })
                    });
            } else {
                // @ts-ignore
                articles.forEach((article) => {
                    bodyConfig.push({
                        infos: this.createArticleInfo(article),
                        ...notTreatedList ? ({
                            rightIcon: {
                                color: 'grey' as IconColor,
                                name: 'up.svg',
                                action: () => {
                                    this.testIfBarcodeEquals(article, false)
                                }
                            },
                        }) : {
                            rightIcon: {
                                name: 'trash.svg',
                                color: 'danger' as IconColor,
                                action: () => {
                                    article.has_moved = 0;
                                    this.updateList(articles)
                                }
                            }
                        },
                    })
                });
            }
        });
// @ts-ignore
        return bodyConfig;
    }

    private async showLogisticUnitContent(articles: Array<ArticleLivraison>, logisticUnit: string) {
        const hasNetwork = await this.networkService.hasNetwork();
        if(hasNetwork){
            const checkLogisticUnitContentOptions = {
                logisticUnit
            };
            this.loadingService.presentLoadingWhile({
                event: () => this.apiService.requestApi(ApiService.CHECK_LOGISTIC_UNIT_CONTENT, {params: checkLogisticUnitContentOptions}),
                message: "Récupération des informations de l'unité logistique en cours..."
            }).subscribe(({extraArticles}: any) => {
                const filteredArticles = articles.filter((article: ArticleLivraison) => article.currentLogisticUnitCode === logisticUnit);
                const options = {
                    articles: filteredArticles,
                    extraArticles,
                    logisticUnit,
                    callback: (articles: any) => this.openModalRemoveArticles(articles)
                };
                this.navService.push(NavPathEnum.DELIVERY_LOGISTIC_UNIT_CONTENT, options)
            });
        } else {
            this.toastService.presentToast('Vous devez être connecté à internet pour pouvoir effectuer cette action.');
        }
    }

    private createLogisticUnitInfo(articles: Array<ArticleLivraison>, logisticUnit: string, natureLabel: string|undefined, location: string) {
        const articlesCount = articles.length;

        return {
            logisticUnit: {
                label: 'Objet',
                value: logisticUnit
            },
            articlesCount: {
                label: `Nombre d'articles`,
                value: this.numberArticlesInLU[logisticUnit] || articlesCount
            },
            location: {
                label: `Emplacement`,
                value: location
            },
            ...natureLabel ? ({
                    nature: {
                        label: `Nature`,
                        value: natureLabel
                    }
                }) : {},
        }
    }

    private openModalRemoveArticles(articles: Array<any>){
        this.alertService.show({
            message: `Cette unité logistique contient des articles non demandés. Elle ne peut pas être livrée en état.`,
            buttons: [{
                text: 'Faire une dépose',
                cssClass: 'full-width',
                handler: () => this.redirectToDeposeOrUlAssociation(NavPathEnum.EMPLACEMENT_SCAN, this.livraison, articles),
            }, {
                text: 'Faire une association UL',
                cssClass: 'full-width',
                handler: () => this.redirectToDeposeOrUlAssociation(NavPathEnum.ASSOCIATION, this.livraison, articles),
            }]
        });
    }
}
