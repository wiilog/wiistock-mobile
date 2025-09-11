import {Component, ViewChild} from '@angular/core';
import {BarcodeScannerComponent} from '@common/components/barcode-scanner/barcode-scanner.component';
import {Collecte} from '@entities/collecte';
import {ArticleCollecte} from '@entities/article-collecte';
import {HeaderConfig} from '@common/components/panel/model/header-config';
import {ListPanelItemConfig} from '@common/components/panel/model/list-panel/list-panel-item-config';
import {IconConfig} from '@common/components/panel/model/icon-config';
import {ToastService} from '@app/services/toast.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {ApiService} from '@app/services/api.service';
import {NavService} from '@app/services/nav/nav.service';
import {filter, mergeMap, map} from 'rxjs/operators';
import {Mouvement} from '@entities/mouvement';
import * as moment from 'moment';
import {from, Observable, of, zip} from 'rxjs';
import {IconColor} from '@common/components/icon/icon-color';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {StorageService} from '@app/services/storage/storage.service';
import {AlertService} from '@app/services/alert.service';
import {NetworkService} from '@app/services/network.service';
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {LoadingService} from "@app/services/loading.service";
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";


@Component({
    selector: 'wii-collecte-articles',
    templateUrl: './collecte-articles.page.html',
    styleUrls: ['./collecte-articles.page.scss'],
})
export class CollecteArticlesPage implements CanLeave, ViewWillEnter, ViewWillLeave {
    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public collecte: Collecte;

    public articlesNT: Array<ArticleCollecte>;
    public articlesT: Array<ArticleCollecte>;

    public listBoldValues?: Array<string>;
    public listToTreatConfig?: { header: HeaderConfig; body: Array<ListPanelItemConfig>; };
    public listTreatedConfig?: { header: HeaderConfig; body: Array<ListPanelItemConfig>; };
    public collecteHeaderConfig?: {
        leftIcon: IconConfig;
        title: string;
        subtitle?: Array<string>;
        info?: string;
    };
    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.INVISIBLE;

    public started: boolean = false;
    public isValid: boolean = true;
    public loadingStartCollecte: boolean;

    private partialCollecteAlert?: HTMLIonAlertElement;

    private isLoading: boolean;

    private goToDrop: () => void;
    private canLeave: boolean;

    private screenAlreadyClosed: boolean;

    public constructor(private toastService: ToastService,
                       private sqliteService: SqliteService,
                       private networkService: NetworkService,
                       private localDataManager: LocalDataManagerService,
                       private alertService: AlertService,
                       private apiService: ApiService,
                       private storageService: StorageService,
                       private loadingService: LoadingService,
                       private navService: NavService) {
        this.loadingStartCollecte = false;
        this.isLoading = false;
        this.canLeave = true;
    }

    public ionViewWillEnter(): void {
        this.isLoading = false;
        this.collecte = this.navService.param('collecte');
        this.goToDrop = this.navService.param('goToDrop');

        this.collecteHeaderConfig = {
            leftIcon: {name: 'collect.svg'},
            title: `Collecte ${this.collecte.number}`,
            subtitle: [
                `Point de collecte : ${this.collecte.location_from ? this.collecte.location_from : ''}`,
                ...(this.collecte.comment ? [`Commentaire : ${this.collecte.comment}`] : [])
            ],
            info: this.collecte.forStock ? 'Mise en stock' : 'Destruction'
        };

        this.listBoldValues = ['reference', 'label', 'barcode', 'location', 'quantity'];

        if (this.footerScannerComponent) {
            this.footerScannerComponent.fireZebraScan();
        }

        this.sqliteService.findArticlesByCollecte(this.collecte.id).subscribe((articles) => {
            this.updateList(articles, true);
            if (this.articlesT.length > 0) {
                this.started = true;
            }
        });
    }

    public ionViewWillLeave(): void {
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    public wiiCanLeave(): boolean {
        return this.canLeave;
    }

    public refreshOver(): void {
        this.toastService.presentToast('Collecte prête à être finalisée.')
    }

    public refresh(): void {
        this.toastService.presentToast('Quantité bien prélevée.')
    }

    public registerMvt(article: any, quantite: any, pickedArticle?: ArticleCollecte): void {
        if (this.isValid) {
            if (article.quantite !== Number(quantite)) {
                let newArticle: ArticleCollecte = {
                    id: null,
                    label: article.label,
                    reference: article.reference,
                    quantite: Number(quantite),
                    is_ref: pickedArticle ? 0 : article.is_ref,
                    id_collecte: article.id_collecte,
                    has_moved: 1,
                    emplacement: article.emplacement,
                    barcode: pickedArticle ? pickedArticle.barcode : article.barcode,
                };
                let articleAlready = this.articlesT.find(art => (
                    (art.id_collecte === newArticle.id_collecte) &&
                    (art.barcode === newArticle.barcode)
                ));
                if (articleAlready !== undefined) {
                    this.sqliteService
                        .updateArticleCollecteQuantity(articleAlready.id as number, newArticle.quantite + articleAlready.quantite)
                        .pipe(
                            mergeMap(() => this.sqliteService.updateArticleCollecteQuantity(article.id, article.quantite - newArticle.quantite)),
                            mergeMap(() => this.sqliteService.findArticlesByCollecte(this.collecte.id))
                        )
                        .subscribe((articles) => {
                            this.updateList(articles);
                        });
                }
                else {
                    this.sqliteService.insert('article_collecte', newArticle).subscribe((insertId) => {
                        let mouvement: Mouvement = {
                            id: null,
                            barcode: newArticle.barcode,
                            reference: newArticle.reference,
                            quantity: Number(quantite),
                            date_pickup: moment().format(),
                            location_from: newArticle.emplacement,
                            date_drop: null,
                            location: null,
                            type: 'prise-dépose',
                            is_ref: newArticle.is_ref,
                            id_article_prepa: null,
                            id_prepa: null,
                            id_article_livraison: null,
                            id_livraison: null,
                            id_article_collecte: insertId,
                            id_collecte: newArticle.id_collecte
                        };
                        this.sqliteService.updateArticleCollecteQuantity(article.id, article.quantite - Number(quantite))
                            .pipe(
                                mergeMap(() => this.sqliteService.insert('mouvement', mouvement)),
                                mergeMap(() => this.sqliteService.findArticlesByCollecte(this.collecte.id)))
                            .subscribe((articles) => {
                                this.updateList(articles);
                            });
                    });
                }
            } else {
                let mouvement: Mouvement = {
                    id: null,
                    reference: article.reference,
                    quantity: article.quantite,
                    barcode: pickedArticle ? pickedArticle.barcode : article.barcode,
                    date_pickup: moment().format(),
                    location_from: article.emplacement,
                    date_drop: null,
                    location: null,
                    type: 'prise-dépose',
                    is_ref: pickedArticle ? 0 : article.is_ref,
                    id_article_prepa: null,
                    id_prepa: null,
                    id_article_livraison: null,
                    id_livraison: null,
                    id_article_collecte: article.id,
                    id_collecte: article.id_collecte
                };
                let articleAlready = this.articlesT.find(art => (
                    (art.id_collecte === mouvement.id_collecte) &&
                    (art.is_ref === mouvement.is_ref) &&
                    (art.barcode === mouvement.barcode)
                ));
                if (articleAlready !== undefined) {
                    this.sqliteService
                        .updateArticleCollecteQuantity(articleAlready.id as number, mouvement.quantity + articleAlready.quantite)
                        .pipe(
                            mergeMap(() => this.sqliteService.deleteBy('article_collecte', [`id = ${mouvement.id_article_collecte}`])),
                            mergeMap(() => this.sqliteService.findArticlesByCollecte(this.collecte.id))
                        )
                        .subscribe((articles) => {
                            this.updateList(articles);
                        });
                } else {
                    let newArticle: ArticleCollecte = {
                        id: null,
                        label: article.label,
                        reference: article.reference,
                        quantite: Number(quantite),
                        is_ref: pickedArticle ? 0 : article.is_ref,
                        id_collecte: article.id_collecte,
                        has_moved: 1,
                        emplacement: article.emplacement,
                        barcode: pickedArticle ? pickedArticle.barcode : article.barcode,
                    };
                    this.sqliteService
                        .insert('mouvement', mouvement)
                        .pipe(
                            mergeMap(() => (
                                !pickedArticle
                                    ? this.sqliteService.moveArticleCollecte(article.id)
                                    : zip(
                                        this.sqliteService.deleteBy('article_collecte', [`id = ${article.id}`]),
                                        this.sqliteService.insert('article_collecte', newArticle)
                                    )
                            )),
                            mergeMap(() => this.sqliteService.findArticlesByCollecte(this.collecte.id))
                        )
                        .subscribe((articles) => {
                            this.updateList(articles);
                        });
                }
            }
        }
    }

    public validate(): void {
        if (this.articlesT.length === 0) {
            this.toastService.presentToast('Veuillez sélectionner au moins une ligne');
        } else if (this.articlesNT.length > 0) {
            this.alertPartialCollecte();
        } else {
            this.finishCollecte();
        }
    }

    public testIfBarcodeEquals(text: any, fromText = true): void {
        const article = fromText
            ? this.articlesNT.find(article => (article.barcode === text))
            : text;
        if (article) {
            const pickingPage = (article.is_ref && article.quantity_type === 'article')
                ? NavPathEnum.COLLECTE_ARTICLE_PICKING
                : NavPathEnum.COLLECTE_ARTICLE_TAKE
            this.navService.push(pickingPage, {
                article,
                selectArticle: (quantity: number, pickedArticle: ArticleCollecte) => {
                    this.selectArticle(article, quantity, pickedArticle);
                }
            });
        }
        else {
            this.toastService.presentToast('L\'article scanné n\'est pas dans la liste.');
        }
    }

    private async alertPartialCollecte(): Promise<void> {
        if (this.partialCollecteAlert) {
            this.partialCollecteAlert.dismiss();
            this.partialCollecteAlert = undefined;
        } else {
            this.partialCollecteAlert = await this.alertService.show({
                header: `Votre collecte est partielle`,
                backdropDismiss: false,
                buttons: [
                    {
                        text: 'Annuler',
                        role: 'cancel',
                        handler: () => {
                            this.partialCollecteAlert = undefined;
                        }
                    },
                    {
                        text: 'Continuer',
                        handler: () => {
                            this.partialCollecteAlert = undefined;
                            this.finishCollecte();
                        },
                        cssClass: 'alert-success'
                    }
                ]
            });
        }
    }

    private async selectArticle(article: any, quantity: any, pickedArticle: ArticleCollecte) {
        const hasNetwork = await this.networkService.hasNetwork();
        if (!this.started && hasNetwork) {
            this.loadingStartCollecte = true;
            this.apiService
                .requestApi(ApiService.BEGIN_COLLECTE, {params: {id: this.collecte.id}})
                .subscribe((resp) => {
                    if (resp.success) {
                        this.started = true;
                        this.isValid = true;
                        this.toastService.presentToast('Collecte commencée.');
                        this.registerMvt(article, quantity, pickedArticle);
                    } else {
                        this.isValid = false;
                        this.loadingStartCollecte = false;
                        this.toastService.presentToast(resp.message);
                    }
                });
        }
        else {
            if (!hasNetwork) {
                this.toastService.presentToast('Collecte commencée en mode hors ligne');
            }

            this.registerMvt(article, quantity, pickedArticle);
        }
    }

    private updateList(articles: Array<ArticleCollecte>, isInit: boolean = false): void {
        this.articlesNT = articles.filter(({has_moved}) => (has_moved === 0));
        this.articlesT = articles.filter(({has_moved}) => (has_moved === 1));

        this.listToTreatConfig = this.createListToTreatConfig();
        this.listTreatedConfig = this.createListTreatedConfig();

        if (!isInit) {
            if (this.articlesNT.length === 0) {
                this.refreshOver();
            }
            else {
                this.refresh();
            }
            this.loadingStartCollecte = false;
        }
    }

    private finishCollecte(): void {
        if (!this.isLoading) {
            this.isLoading = true;

            this.canLeave = false;
            this.loadingService.presentLoadingWhile({
                message: 'Chargement...',
                event: () => {
                    return this.sqliteService
                        .findArticlesByCollecte(this.collecte.id)
                        .pipe(
                            mergeMap((articles) => zip(
                                ...articles.map((article) => (
                                    this.sqliteService
                                        .findMvtByArticleCollecte(article.id as number)
                                        .pipe(mergeMap((mvt) => (
                                            mvt
                                                ? this.sqliteService.finishMvt(mvt.id)
                                                : of(undefined)
                                        )))
                                ))
                            )),
                            mergeMap(() => this.sqliteService.finishCollecte(this.collecte.id)),
                            mergeMap(() => from(this.networkService.hasNetwork())),
                            mergeMap((hasNetwork): any => (
                                hasNetwork
                                    ? this.localDataManager.sendFinishedProcess('collecte')
                                    : of({offline: true})
                            )),
                            mergeMap((res: any) => (
                                res.offline || res.success.length > 0
                                    ? this.storageService.incrementCounter(StorageKeyEnum.COUNTERS_COLLECTS_TREATED).pipe(map(() => res))
                                    : of(res)
                            )),
                        )
                }
            })
                .subscribe({
                    next: ({offline, success}: any) => {
                        this.canLeave = true;
                        this.screenAlreadyClosed = false;
                        if (this.collecte && this.collecte.forStock && success.length > 0) {
                            this.alertService.show({
                                header: 'Collecte validée',
                                cssClass: AlertService.CSS_CLASS_MANAGED_ALERT,
                                message: 'Pour valider l\'entrée en stock, vous devez effectuer la dépose',
                                buttons: [{
                                    text: 'Aller vers la dépose',
                                    cssClass: 'alert-success',
                                    handler: () => {
                                        this.canLeave = true;
                                        this.closeScreen(offline ? [] : success, offline)
                                            .pipe(filter((screenClosed) => screenClosed))
                                            .subscribe(() => {
                                                this.goToDrop();
                                            });
                                    }
                                }]
                            }, () => this.closeScreen(offline ? [] : success, offline))
                        } else {
                            this.closeScreen(offline ? [] : success, offline);
                        }
                    },
                    error: (error) => {
                        this.handlePreparationError(error);
                    }
                });
        } else {
            this.toastService.presentToast('Chargement en cours veuillez patienter.');
        }
    }

    private closeScreen(success: Array<{ newCollecte: any, articlesCollecte: any }>, isOffline: boolean = false): Observable<boolean> {
        if (!this.screenAlreadyClosed) {
            this.screenAlreadyClosed = true;
            if (isOffline || success.length > 0) {
                this.toastService.presentToast(
                    (success.length > 0)
                        ? (
                            (success.length === 1
                                ? 'Votre collecte a bien été enregistrée'
                                : `Votre collecte et ${success.length - 1} collecte${success.length - 1 > 1 ? 's' : ''} en attente ont bien été enregistrées`)
                        )
                        : 'Collecte sauvegardée localement, nous l\'enverrons au serveur une fois internet retrouvé'
                );
            }

            this.isLoading = false;
            return this.navService.pop().pipe(map(() => true));
        }
        else {
            return of(false);
        }
    }

    private handlePreparationError(resp: any): void {
        this.isLoading = false;
        this.toastService.presentToast((resp && resp.api && resp.message) ? resp.message : 'Une erreur s\'est produite');
    }

    private createListToTreatConfig(): { header: HeaderConfig; body: Array<ListPanelItemConfig>; } | undefined {
        const articlesNumber = (this.articlesNT ? this.articlesNT.length : 0);
        const articlesPlural = articlesNumber > 1 ? 's' : '';
        return articlesNumber > 0
            ? {
                header: {
                    title: 'À collecter',
                    info: `${articlesNumber} article${articlesPlural} à scanner`,
                    leftIcon: {
                        name: 'download.svg',
                        color: 'list-orange-light'
                    },
                    rightIcon: {
                        color: 'primary',
                        name: 'scan-photo.svg',
                        action: () => {
                            this.footerScannerComponent.scan();
                        }
                    }
                },
                body: this.articlesNT.map((articleCollecte: ArticleCollecte) => ({
                    infos: this.createArticleInfo(articleCollecte),
                    rightIcon: {
                        color: 'grey' as IconColor,
                        name: 'up.svg',
                        action: () => {
                            this.testIfBarcodeEquals(articleCollecte, false)
                        }
                    }
                }))
            }
            : undefined;
    }

    private createListTreatedConfig(): { header: HeaderConfig; body: Array<ListPanelItemConfig>; } {
        const pickedArticlesNumber = (this.articlesT ? this.articlesT.length : 0);
        const pickedArticlesPlural = pickedArticlesNumber > 1 ? 's' : '';
        return {
            header: {
                title: 'Collecté',
                info: `${pickedArticlesNumber} article${pickedArticlesPlural} scanné${pickedArticlesPlural}`,
                leftIcon: {
                    name: 'upload.svg',
                    color: 'list-orange'
                }
            },
            body: this.articlesT.map((articleCollecte: ArticleCollecte) => ({
                infos: this.createArticleInfo(articleCollecte)
            }))
        };
    }

    private createArticleInfo({reference, reference_label, barcode, emplacement, quantite}: ArticleCollecte): {[name: string]: { label: string; value: string; }} {
        return {
            reference: {
                label: 'Référence',
                value: reference
            },
            label: {
                label: 'Libellé',
                value: reference_label || ''
            },
            barcode: {
                label: 'Code barre',
                value: barcode || ''
            },
            ...(
                emplacement && emplacement !== 'null'
                    ? {
                        location: {
                            label: 'Emplacement',
                            value: emplacement || ''
                        }
                    }
                    : {}
            ),
            ...(
                quantite
                    ? {
                        quantity: {
                            label: 'Quantité',
                            value: `${quantite}`
                        }
                    }
                    : {}
            )
        };
    }
}
