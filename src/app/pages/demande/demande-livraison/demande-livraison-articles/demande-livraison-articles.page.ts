import {ChangeDetectorRef, Component, EventEmitter, ViewChild} from '@angular/core';
import {Emplacement} from '@database/emplacement';
import {HeaderConfig} from '@common/components/panel/model/header-config';
import {ListPanelItemConfig} from '@common/components/panel/model/list-panel/list-panel-item-config';
import {BarcodeScannerModeEnum} from '@common/components/barcode-scanner/barcode-scanner-mode.enum';
import {from, Observable, of, zip} from 'rxjs';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {ToastService} from '@app/services/toast.service';
import {LoadingService} from '@app/services/loading.service';
import {StorageService} from '@app/services/storage/storage.service';
import {filter, mergeMap, map} from 'rxjs/operators';
import {NavService} from '@app/services/nav/nav.service';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {DemandeLivraison} from '@database/demande-livraison';
import {DemandeLivraisonType} from '@database/demande-livraison-type';
import {DemandeLivraisonArticle} from '@database/demande-livraison-article';
import {SelectItemTypeEnum} from '@common/components/select-item/select-item-type.enum';
import {SelectItemComponent} from '@common/components/select-item/select-item.component';
import {IconColor} from '@common/components/icon/icon-color';
import {FreeField, FreeFieldType} from '@database/free-field';
import {FormPanelService} from '@app/services/form-panel.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {AlertService} from '@app/services/alert.service';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";


@Component({
    selector: 'wii-demande-livraison-articles',
    templateUrl: './demande-livraison-articles.page.html',
    styleUrls: ['./demande-livraison-articles.page.scss'],
})
export class DemandeLivraisonArticlesPage implements ViewWillEnter, ViewWillLeave, CanLeave {

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public listBoldValues: Array<string>;

    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.TOOL_SEARCH;
    public readonly scannerType: SelectItemTypeEnum = SelectItemTypeEnum.DEMANDE_LIVRAISON_ARTICLES;

    public resetSelectItemEmitter$: EventEmitter<void>;

    public loading: boolean;

    public fromStock: boolean;

    public headerConfig: HeaderConfig;
    public bodyConfig: Array<ListPanelItemConfig>;

    private selectedArticles: Array<DemandeLivraisonArticle>;

    private demandeId: number;

    private alertPresented: boolean;
    private loadingPresented: boolean;
    private isUpdate: boolean;
    private pageAlreadyInit: boolean;

    public constructor(private sqliteService: SqliteService,
                       private formPanelService: FormPanelService,
                       private storageService: StorageService,
                       private alertService: AlertService,
                       private toastService: ToastService,
                       private changeDetector: ChangeDetectorRef,
                       private loadingService: LoadingService,
                       private navService: NavService) {
        this.loading = false;
        this.resetSelectItemEmitter$ = new EventEmitter<void>();
        this.selectedArticles = [];
        this.listBoldValues = [
            'reference',
            'label',
            'barcode',
            'quantity',
            'location',
            'management'
        ];
    }

    public ionViewWillEnter(): void {
        this.selectItemComponent.fireZebraScan();

        this.demandeId = this.navService.param('demandeId');
        this.isUpdate = Boolean(this.navService.param('isUpdate'));

        if (!this.pageAlreadyInit) {
            this.selectedArticles = [];
            this.pageAlreadyInit = true;
            this.loading = true;
            this.sqliteService
                .findOneById('demande_livraison', this.demandeId)
                .pipe(
                    filter(Boolean),
                    mergeMap((demandeLivraison: DemandeLivraison) => (
                        zip(
                            this.sqliteService.findOneById('demande_livraison_type', demandeLivraison.type_id),
                            this.sqliteService.findOneById('emplacement', demandeLivraison.location_id),
                            this.sqliteService.findArticlesInDemandeLivraison(demandeLivraison.id),
                            this.storageService.getString(StorageKeyEnum.OPERATOR),
                            this.sqliteService.findBy('free_field', [`categoryType = '${FreeFieldType.DELIVERY_REQUEST}'`])
                        )
                            .pipe((map(([type, location, articles, operator, freeFields]) => ([demandeLivraison, type, location, articles, operator, freeFields]))))
                    ))
                )
                .subscribe(([demandeLivraison, type, location, articles, operator, freeFields]) => {
                    this.loading = false;
                    this.selectedArticles = articles;
                    this.headerConfig = this.createHeaderConfig(demandeLivraison, type, location, operator, articles.length, freeFields);
                    this.bodyConfig = this.createBodyConfig(articles);
                });
        }
    }

    public ionViewWillLeave(): void {
        this.selectItemComponent.unsubscribeZebraScan();
    }

    public wiiCanLeave(): boolean {
        return !this.alertPresented && !this.loadingPresented;
    }

    public addArticleInDemande(article: DemandeLivraisonArticle) {
        const index = this.selectedArticles.findIndex(({reference}) => (reference === article.reference));
        if (index > -1) {
            this.selectedArticles[index] = article;
        }
        else {
            this.selectedArticles.push(article);
        }
        this.headerConfig.info = this.getInfoHeaderConfig(this.selectedArticles.length);
        this.bodyConfig = this.createBodyConfig(this.selectedArticles);
        this.resetSelectItemEmitter$.emit();
    }

    public selectArticleQuantity(article?: DemandeLivraisonArticle) {
        this.navService.push(NavPathEnum.DEMANDE_LIVRAISON_ARTICLE_TAKE, {
            addArticleInDemande: (articleToSelect: DemandeLivraisonArticle) => this.addArticleInDemande(articleToSelect),
            article
        });
    }

    private createHeaderConfig(demandeLivraison: DemandeLivraison,
                               type: DemandeLivraisonType,
                               location: Emplacement,
                               operator: string,
                               articlesCounter: number,
                               freeFields: Array<FreeField>): HeaderConfig {
        const freeFieldsValues = JSON.parse(demandeLivraison.free_fields);

        const subtitle = [
            `Demandeur : ${operator || ''}`,
            `Emplacement : ${location ? location.label : ''}`,
            `Type : ${type ? type.label : ''}`,
            ...freeFields
                .filter(({typeId}) => (demandeLivraison.type_id == typeId))
                .map((freeField: FreeField) => this.formPanelService.formatFreeField(freeField, freeFieldsValues[freeField.freeFieldId]))
        ];

        if (demandeLivraison.comment) {
            subtitle.push(`Commentaire : ${demandeLivraison.comment}`);
        }

        return {
            title: 'Demande',
            subtitle,
            action: () => {
                this.navService.pop();
            },
            info: this.getInfoHeaderConfig(articlesCounter),
            leftIcon: {
                name: 'demande.svg',
                color: 'warning' as IconColor
            },
            rightIcon: [
                {
                    name: 'check.svg',
                    color: 'success' as IconColor,
                    action: () => {
                        this.saveSelectedArticles();
                    }
                },
                {
                    name: 'trash.svg',
                    color: 'danger' as IconColor,
                    action: () => {
                        this.presentAlertToDeleteDemande();
                    }
                }
            ]
        };
    }

    private saveSelectedArticles(): void {
        this.loadingPresented = true;
        zip(
            this.loadingService.presentLoading(),
            this.deleteSavedArticleInDemande()
        )
            .pipe(
                mergeMap(([loading]: [HTMLIonLoadingElement, any]) => (
                    this.selectedArticles.length > 0
                        ? zip(
                            ...(this.selectedArticles.map(({quantity_to_pick, barcode}) => (
                                this.sqliteService.insert('article_in_demande_livraison', {
                                    article_barcode: barcode,
                                    demande_id: this.demandeId,
                                    quantity_to_pick
                                })
                            )))
                        ).pipe(map(() => loading))
                        : of(loading)
                )),
                mergeMap((loading: HTMLIonLoadingElement) => from(loading.dismiss()))
            )
            .subscribe(() => {
                this.loadingPresented = false;
                this.popPage();
            });
    }

    private getInfoHeaderConfig(articlesCounter: number): string {
        const sArticle = articlesCounter > 1 ? 's' : '';
        return `Non synchronisée, ${articlesCounter} article${sArticle} scanné${sArticle}`;
    }

    private presentAlertToDeleteDemande(): void {
        this.alertPresented = true;
        this.alertService.show({
            header: 'Confirmation',
            cssClass: AlertService.CSS_CLASS_MANAGED_ALERT,
            message: 'Êtes-vous sur de vouloir supprimer cette demande de livraison ?',
            buttons: [
                {
                    text: 'Confirmer',
                    cssClass: 'alert-success',
                    handler: () => {
                        this.alertPresented = false;
                        this.deleteDemande();
                    }
                },
                {
                    text: 'Annuler',
                    cssClass: 'alert-danger',
                    role: 'cancel',
                    handler: () => {
                        this.alertPresented = false;
                    }
                }
            ]
        });
    }

    private deleteDemande(): void {
        this.loadingPresented = true;
        zip(
            this.loadingService.presentLoading(),
            this.sqliteService.deleteBy('demande_livraison', [`id = ${this.demandeId}`]),
            this.deleteSavedArticleInDemande()
        )
            .pipe(
                mergeMap(([loading]: [HTMLIonLoadingElement, any, any]) => from(loading.dismiss()))
            )
            .subscribe(() => {
                this.loadingPresented = false;
                this.popPage();
            });
    }

    private popPage() {
        this.navService
            .pop()
            .subscribe(() => {
                this.navService.pop();
            });
    }

    private createBodyConfig(articles: Array<DemandeLivraisonArticle>): Array<ListPanelItemConfig> {
        return articles.map((article: DemandeLivraisonArticle, index: number) => ({
            infos: {
                reference: {
                    label: 'Article',
                    value: article.reference
                },
                label: {
                    label: 'Libellé',
                    value: article.label
                },
                barcode: {
                    label: 'Code barre',
                    value: article.barcode
                },
                quantity: {
                    label: 'Quantité',
                    value: article.quantity_to_pick ? String(article.quantity_to_pick) : '0'
                },
                ...(
                    article.location_label
                    ? {
                        location: {
                            label: 'Emplacement',
                            value: article.location_label
                        }
                    }
                : {}),
                management: {
                    label: 'Gestion',
                    value: (
                        article.type_quantity === 'reference' ? 'Par référence' :
                        article.type_quantity === 'article' ? 'Par article' :
                        article.type_quantity
                    )
                }
            },
            pressAction: () => {
                this.selectArticleQuantity(article);
            },
            rightIcon: {
                name: 'trash.svg',
                color: 'danger',
                action: () => {
                    this.removeArticleFromSelected(index);
                }
            },
        }));
    }

    private removeArticleFromSelected(index: number): void {
        this.selectedArticles.splice(index, 1);
        this.headerConfig.info = this.getInfoHeaderConfig(this.selectedArticles.length);
        this.bodyConfig = this.createBodyConfig(this.selectedArticles);
    }

    private deleteSavedArticleInDemande(): Observable<any> {
        return this.sqliteService.deleteBy('article_in_demande_livraison', [`demande_id = ${this.demandeId}`]);
    }
}
