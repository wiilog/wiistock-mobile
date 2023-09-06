import {Component, ViewChild} from '@angular/core';
import {BarcodeScannerComponent} from '@common/components/barcode-scanner/barcode-scanner.component';
import {ApiService} from '@app/services/api.service';
import {ToastService} from '@app/services/toast.service';
import {LoadingService} from '@app/services/loading.service';
import {NavService} from '@app/services/nav/nav.service';
import {AlertService} from '@app/services/alert.service';
import {NetworkService} from '@app/services/network.service';
import {zip} from 'rxjs';
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {ListPanelItemConfig} from "@common/components/panel/model/list-panel/list-panel-item-config";
import {IconConfig} from "@common/components/panel/model/icon-config";
import {mergeMap} from "rxjs/operators";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";
import {CardListConfig} from "@common/components/card-list/card-list-config";
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";

type ArticleAssociation = {
    barCode: string,
    label: string,
    quantity: number,
    location?: string,
    reference: string,
    currentLogisticUnitCode?: string,
    articles: Array<string>,
    project?: string,
    is_lu: boolean
};

@Component({
    selector: 'wii-association',
    templateUrl: './association.page.html',
    styleUrls: ['./association.page.scss'],
})
export class AssociationPage implements ViewWillEnter, ViewWillLeave {

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public readonly scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.ONLY_MANUAL;
    public loading: boolean = false;
    public barcodeCheckLoading: boolean = false;
    public listBoldValues?: Array<string>;
    public listBody: Array<CardListConfig>;
    public articlesList: Array<ArticleAssociation>;
    public headerConfig?: {
        leftIcon: IconConfig;
        rightIcon: IconConfig;
        title: string;
        subtitle?: Array<string>;
        info?: string;
    };

    public constructor(private networkService: NetworkService,
                       private apiService: ApiService,
                       private alertService: AlertService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private navService: NavService) {
    }

    public ionViewWillEnter(): void {
        this.articlesList = this.navService.param('articlesList') || [];
        this.listBoldValues = ['barCode', 'label', 'location', 'quantity'];
        this.refreshHeader();
        this.refreshList();
    }

    public ionViewWillLeave(): void {
        this.footerScannerComponent.unsubscribeZebraScan();
    }

    public validate() {
        if (this.articlesList.length === 0) {
            this.toastService.presentToast('Veuillez flasher au moins un article et une unité logistique');
        } else if (!this.articlesList.some((article) => article.is_lu)) {
            this.toastService.presentToast('Vous devez flasher une unité logistique pour valider');
        } else if (this.articlesList.length === 1) {
            this.toastService.presentToast('Vous devez flasher au moins un article pour valider');
        } else {
            this.finish();
        }
    }

    public finish(needsCheck = true) {
        const logisticUnit = this.articlesList.filter((article) => article.is_lu)[0];
        const needsLocationPicking = !logisticUnit.location;
        const articlesWithLogisticUnit = this.articlesList.filter((article) => article.currentLogisticUnitCode);
        const articlesWithLogisticUnitContent = articlesWithLogisticUnit
            .map((articleWithLogisticUnit) => `<strong>${articleWithLogisticUnit.barCode}</strong> de ${articleWithLogisticUnit.currentLogisticUnitCode}`)
            .join(`<br>`)
        if (articlesWithLogisticUnit.length > 0 && needsCheck) {
            this.alertService.show({
                header: 'Les articles suivants seront enlevés de leur unité logistique :',
                message: articlesWithLogisticUnitContent,
                buttons: [
                    {
                        text: 'Annuler',
                        role: 'cancel'
                    },
                    {
                        text: 'Confirmer',
                        cssClass: 'alert-success',
                        handler: () => this.finish(false)
                    }
                ]
            });
        } else {
            if (needsLocationPicking) {
                this.navService.push(NavPathEnum.EMPLACEMENT_SCAN, {
                    fromDepose: false,
                    fromStock: true,
                    customAction: (location: string) => this.locationSelectCallback(location)
                });
            } else {
                this.doAPICall(logisticUnit);
            }
        }
    }

    public locationSelectCallback(location: string): void {
        const [logisticUnit] = this.articlesList.filter((article) => article.is_lu);
        if (logisticUnit) {
            logisticUnit.location = location;
            this.doAPICall(logisticUnit);
        }
    }

    public async doAPICall(logisticUnit: ArticleAssociation) {
        const articlesToDrop = this.articlesList.filter((article) => !article.is_lu);
        const hasNetwork = await this.networkService.hasNetwork();
        if (hasNetwork) {
            this.barcodeCheckLoading = true;
            this.loadingService
                .presentLoadingWhile({
                    message: 'Vérification...',
                    event: () => this.apiService
                        .requestApi(ApiService.DROP_IN_LU, {
                            params: {
                                articles: articlesToDrop.map((article) => article.barCode),
                                lu: logisticUnit.barCode,
                                location: logisticUnit.location
                            }
                        }).pipe(
                            mergeMap(() => zip(
                                this.toastService.presentToast('Association UL - Articles effectuée.'),
                                this.navService.pop(),
                            ))
                        )
                })
                .subscribe({
                    next: () => {
                        const livraisonToRedirect = this.navService.param('livraisonToRedirect') || undefined;
                        if (livraisonToRedirect) {
                            this.navService.push(NavPathEnum.LIVRAISON_ARTICLES, {
                                livraison: livraisonToRedirect
                            });
                        }
                    },
                    error: () => {
                        this.barcodeCheckLoading = false;
                        this.toastService.presentToast('Erreur serveur');
                    }
                });
        } else {
            this.toastService.presentToast('Vous devez être connecté à internet pour effectuer une prise.');
        }
    }

    public async scan(barCode: string) {
        const hasNetwork = await this.networkService.hasNetwork();
        if (hasNetwork) {
            this.barcodeCheckLoading = true;
            this.loadingService
                .presentLoadingWhile({
                    message: 'Vérification...',
                    event: () => this.apiService
                        .requestApi(ApiService.GET_ARTICLES, {
                            params: {
                                barCode,
                                createIfNotExist: true
                            }
                        })
                })
                .subscribe({
                    next: (res) => {
                        const article = (
                            res
                            && res.success
                            && res.article
                        );
                        const existing = this.articlesList.some((articleElement) => articleElement.barCode === article.barCode);
                        if (existing) {
                            this.toastService.presentToast('Vous avez déjà scanné cet article ou cette unité logistique.');
                        } else if (!article && !res.can_associate) {
                            this.toastService.presentToast(`L'article scanné n'est pas en statut disponible.`);
                        } else if (article && (!article.is_lu || this.articlesList.every((articleElement) => !articleElement.is_lu))) {
                            if (article.is_ref) {
                                this.toastService.presentToast('Vous ne pouvez pas scanner une référence.');
                            } else {
                                this.articlesList.push(article);
                                this.refreshList();
                                this.refreshHeader();
                            }
                        } else {
                            this.toastService.presentToast('Vous avez déjà scanné une unité logistique.');
                        }
                    },
                    error: () => {
                        this.barcodeCheckLoading = false;
                        this.toastService.presentToast('Erreur serveur');
                    }
                });
        }
        else {
            this.toastService.presentToast('Vous devez être connecté à internet pour effectuer une prise');
        }
    }

    public refreshHeader() {
        this.headerConfig = {
            leftIcon: {
                name: 'association.svg',
                color: 'tertiary'
            },
            rightIcon: {
                color: 'primary',
                name: 'scan-photo.svg',
                action: () => {
                    this.footerScannerComponent.scan();
                }
            },
            title: `Scanner article(s) et Unité logistique`,
            subtitle: [
                `${this.articlesList.filter((article) => !article.is_lu).length} article(s) scanné(s) et ${this.articlesList.some((article) => article.is_lu)  ? '1' : '0'} UL scannée`,
            ]
        };
    }

    public refreshList() {
        this.listBody = this.articlesList
            .sort((article) => article.is_lu ? -1 : 1)
            .map((article) => ({
                ...(article.is_lu
                    ? {
                        title: {
                            label: 'Unité logistique',
                            value: article.barCode
                        }
                    }
                    : {}),
                customColor: '#2DBDB8',
                content: this.createArticleInfo(article),
                rightIcon: {
                    name: 'trash.svg',
                    color: 'danger',
                    action: () => {
                        this.removeArticle(article);
                        this.toastService.presentToast(article.is_lu ? `L'unité logistique a bien été supprimée.` : `L'article a bien été supprimé.`);
                    }
                }
            }));
    }

    public removeArticle(article: ArticleAssociation) {
        this.articlesList.splice(this.articlesList.indexOf(article), 1);
        this.refreshList();
        this.refreshHeader();
    }

    public createArticleInfo(articleOrPack: ArticleAssociation): Array<{ label?: string; value?: string; itemConfig?: ListPanelItemConfig; }> {
        return [
            ...(
                articleOrPack.is_lu && articleOrPack.project
                    ? [{
                        label: `Projet`,
                        value: articleOrPack.project
                    }]
                    : (!articleOrPack.is_lu ? [{
                        label: 'Libellé',
                        value: articleOrPack.label && articleOrPack.label.length > 28 ? articleOrPack.label.substring(0, 25) + '...' : articleOrPack.label
                    }] : [{}])
            ),
            ...!articleOrPack.is_lu
                ? [{
                    label: 'Code barre',
                    value: articleOrPack.barCode
                }] : [{}],
            {
                label: 'Emplacement',
                value: articleOrPack.location
            },
            {
                label: articleOrPack.is_lu ? 'Nombre d\'article(s)' : 'Quantité',
                value: String(articleOrPack.is_lu ? (articleOrPack.articles ? articleOrPack.articles.length : 0) : articleOrPack.quantity),
            }
        ];
    }

}
