import {Component, ViewChild} from '@angular/core';
import {BarcodeScannerComponent} from '@common/components/barcode-scanner/barcode-scanner.component';
import {HeaderConfig} from '@common/components/panel/model/header-config';
import {ListPanelItemConfig} from '@common/components/panel/model/list-panel/list-panel-item-config';
import {ToastService} from '@app/services/toast.service';
import {ApiService} from '@app/services/api.service';
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {
    FormPanelSelectComponent
} from '@common/components/panel/form-panel/form-panel-select/form-panel-select.component';
import {SelectItemTypeEnum} from '@common/components/select-item/select-item-type.enum';
import {FormPanelParam} from '@common/directives/form-panel/form-panel-param';
import {FormPanelComponent} from '@common/components/panel/form-panel/form-panel.component';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";
import {LoadingService} from "@app/services/loading.service";
import {NavService} from "@app/services/nav/nav.service";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";
import {Emplacement} from "@entities/emplacement";

@Component({
    selector: 'wii-manual-collect-articles',
    templateUrl: './manual-collect-articles.page.html',
    styleUrls: ['./manual-collect-articles.page.scss'],
})
export class ManualCollectArticlesPage implements ViewWillLeave, ViewWillEnter {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.INVISIBLE;

    private selectedReferences: Array<{
        id: number;
        refArticleBarCode: string;
        'article-to-pick': string;
        label: string;
        reference: string;
        quantityType: string;
        location: string;
        'quantity-to-pick': number;
        dropLocation?: number;
    }> = [];

    public listBoldValues?: Array<string>;
    public headerConfig?: HeaderConfig;
    public listConfig?: ListPanelItemConfig[];
    public formConfig: Array<FormPanelParam>;

    public constructor(private toastService: ToastService,
                       private apiService: ApiService,
                       private loadingService: LoadingService,
                       private navService: NavService) {
    }

    public ionViewWillEnter() {
        if (this.footerScannerComponent) {
            this.footerScannerComponent.fireZebraScan();
        }

        this.listBoldValues = ['reference', 'label', 'barCode', 'location', 'quantity'];

        this.refreshConfig();
    }

    public refreshConfig() {
        this.headerConfig = this.createHeaderConfig();
        this.listConfig = this.createBodyConfig();

        this.getFormConfig();
    }

    public getFormConfig(): void {
        const {type, pickLocation} = this.formPanelComponent
            ? this.formPanelComponent.values
            : {type: null, pickLocation: null};

        this.formConfig = [
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Type',
                    name: 'type',
                    value: type,
                    inputConfig: {
                        required: true,
                        defaultIfSingle: true,
                        searchType: SelectItemTypeEnum.TYPE,
                        requestParams: [
                            `category = 'demande collecte'`,
                        ],
                    },
                    errors: {
                        required: 'Vous devez sélectionner un type'
                    }
                }
            },
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Emplacement de prise',
                    name: 'pickLocation',
                    value: pickLocation,
                    inputConfig: {
                        required: true,
                        searchType: SelectItemTypeEnum.LOCATION,
                    },
                    errors: {
                        required: 'Vous devez sélectionner un emplacement de prise.'
                    }
                }
            },
        ];
    }

    public ionViewWillLeave(): void {
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    public addArticle(article: string) {
        const alreadyScanned = this.selectedReferences.some((selectedReference) => selectedReference.refArticleBarCode === article || selectedReference["article-to-pick"] === article);

        if(alreadyScanned) {
            this.toastService.presentToast(`Ce code barre a déjà été scanné.`);
        } else {
            this.loadingService.presentLoadingWhile({
                event: () => this.apiService.requestApi(ApiService.CHECK_MANUAL_COLLECT_SCAN, {
                    params: {
                        barCode: article,
                    }
                })
            }).subscribe((response) => {
                if (response.reference?.id) {
                    this.navService.push(NavPathEnum.MANUAL_COLLECT_ARTICLE_TAKE, {
                        selectedReference: {
                            ...response.reference,
                            ...(response.article
                                    ? {
                                        'article-to-pick': response.article,
                                    }
                                    : {}
                            ),
                        },
                        selectArticle: (quantity: number, selectedReference: any, dropLocation?: Emplacement) => {
                            this.selectedReferences.push({
                                ...selectedReference,
                                'quantity-to-pick': quantity,
                                dropLocation: dropLocation?.id
                            });
                            this.refreshConfig();
                        }
                    });
                } else {
                    this.toastService.presentToast(`Le code barre scanné ne correspond à aucun article ou référence connu.`);
                }
            });
        }
    }

    public validate(): void {
        const error = this.selectedReferences.length === 0
            ? 'Vous devez selectionner au moins un article'
            : this.formPanelComponent.firstError;
        if (error) {
            this.toastService.presentToast(error)
        } else {
            const {type, pickLocation} = this.formPanelComponent.values;

            this.loadingService.presentLoadingWhile({
                event: () => this.apiService.requestApi(ApiService.FINISH_MANUAL_COLLECT, {
                        params: {
                            references: this.selectedReferences,
                            type,
                            pickLocation,
                        }
                    }
                )
            }).subscribe((response) => {
                if(response.success){
                    this.navService.pop({path: NavPathEnum.STOCK_MENU})
                        .subscribe(() => {
                            this.toastService.presentToast(response.message);
                        });
                } else {
                    this.toastService.presentToast(response.message);
                }
            });
        }
    }

    private createHeaderConfig(): HeaderConfig {
        const articlesCount = this.selectedReferences.length;

        const content = [
            `${articlesCount} article${articlesCount > 1 ? 's' : ''} scanné${articlesCount > 1 ? 's' : ''}`,
        ];

        return {
            title: 'Collecté',
            info: `${content.join(`, `)}`,
            leftIcon: {
                name: 'upload.svg',
                color: 'list-orange-light'
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
            ],
        };
    }

    private createBodyConfig(): Array<ListPanelItemConfig> {
        return this.selectedReferences.map((article, index: number) => ({
            infos: {
                reference: {
                    label: 'Référence',
                    value: article.reference
                },
                label: {
                    label: 'Libellé',
                    value: article.label
                },
                barCode: {
                    label: 'Code barre référence',
                    value: article.refArticleBarCode
                },
                location: {
                    label: 'Emplacement de stockage',
                    value: article.location
                },
                quantity: {
                    label: `Quantité collectée`,
                    value: `${article["quantity-to-pick"]}`,
                },
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
        this.selectedReferences.splice(index, 1);
        this.refreshConfig();
    }
}
