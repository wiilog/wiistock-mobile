import {Component, OnInit, ViewChild} from '@angular/core';
import {ApiService} from "@app/services/api.service";
import {NavService} from "@app/services/nav/nav.service";
import {HeaderConfig} from "@common/components/panel/model/header-config";
import {ListPanelItemConfig} from "@common/components/panel/model/list-panel/list-panel-item-config";
import {IconColor} from "@common/components/icon/icon-color";
import {FormPanelComponent} from "@common/components/panel/form-panel/form-panel.component";
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";
import {ReceptionReferenceArticle} from "@entities/reception-reference-article";
import {ToastService} from "@app/services/toast.service";
import {BarcodeScannerComponent} from "@common/components/barcode-scanner/barcode-scanner.component";
import {LoadingService} from "@app/services/loading.service";
import {ReceptionService} from "@app/services/reception.service";
import {Reception} from "@entities/reception";


@Component({
    selector: 'wii-reception-details',
    templateUrl: './reception-details.page.html',
    styleUrls: ['./reception-details.page.scss'],
})
export class ReceptionDetailsPage implements OnInit {
    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public readonly barcodeScannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.INVISIBLE;

    private reception: Reception;
    private receptionReferenceArticles: Array<ReceptionReferenceArticle> = [];

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public listToTreatConfig?: { header: HeaderConfig; body: Array<ListPanelItemConfig>; };
    public listTreatedConfig?: { header: HeaderConfig; body: Array<ListPanelItemConfig>; };
    public listBoldValues?: Array<string>;

    public receptionHeaderConfig: HeaderConfig;

    public constructor(private apiService: ApiService,
                       private receptionService: ReceptionService,
                       private loadingService: LoadingService,
                       private toastService: ToastService,
                       private navService: NavService) {
    }

    public ngOnInit(): void {
        this.reception = this.navService.param('reception');

        this.listBoldValues = ['reference', 'quantityToReceive', 'receivedQuantity'];

        this.refreshHeader(false);

        this.loadingService.presentLoadingWhile({
            event: () => (
                this.apiService
                    .requestApi(ApiService.GET_RECEPTION_LINES, {
                        pathParams: {
                            reception: this.reception.id
                        }
                    })
            )
        })
            .subscribe({
                next: (response: {
                    success: any;
                    total: number;
                    data: Array<{
                        id: number;
                        pack: number;
                        references: Array<ReceptionReferenceArticle>;
                    }>;
                }) => {
                    if (response.success) {
                        this.receptionReferenceArticles = response.data
                            ?.flatMap(({references}) => references)
                            ?.map(({receivedQuantity, quantityToReceive, ...reference}) => ({
                                ...reference,
                                quantityToReceive,
                                receivedQuantity,
                                remainingQuantity: (quantityToReceive - (receivedQuantity || 0)),
                            })) || [];

                        this.updateViewLists();
                    }

                    if (this.footerScannerComponent) {
                        this.footerScannerComponent.fireZebraScan();
                    }
                },
            });

    }


    public refreshHeader(opened: boolean){
        const serializedReception = this.receptionService.serializeReception(this.reception);
        const receptionContent = Object.entries(serializedReception)
            .filter(([key, item]) => {
                let textValue;
                if (key === 'comment' && item?.value) {
                    // strip html tags
                    const div = document.createElement('div');
                    div.innerHTML = item?.value;
                    textValue = div.textContent;
                }
                else {
                    textValue = item?.value?.trim();
                }
                return textValue;
            })
            .map(([_, {label, value}]) => `${label}: ${value}`);

        this.receptionHeaderConfig = {
            title: `Reception ${this.reception.number}`,
            collapsed: true,
            onToggle: (opened) => {
                this.refreshHeader(opened);
            },
            leftIcon: {
                name: 'reception.svg',
            },
            rightIcon: {
                name: opened ? 'double-arrow-up.svg' : 'double-arrow-down.svg',
                color: 'dark',
                width: '26px',
                action: () => {
                    this.formPanelComponent.formHeaderComponent.toggleTitle();
                }
            },
            subtitle: receptionContent
        };
    }
    public validate(): void {
        console.log('validate') // TODO
    }

    public testIfBarcodeEquals(scanned: string): void {
        const selectedLineTake = this.receptionReferenceArticles.findIndex((reference) => reference.barCode === scanned);

        if(selectedLineTake > -1) {
            this.takeReferenceArticleQuantity(this.receptionReferenceArticles[selectedLineTake]);
        }
        else {
            this.toastService.presentToast('Le code barre scanné ne correspond à aucune référence présente dans cette réception.');
        }
    }

    public updateViewLists(): void {
        this.updateToTreatList(this.receptionReferenceArticles.filter(({remainingQuantity}) => (remainingQuantity > 0)));
        this.updateTreatedList(this.receptionReferenceArticles.filter(({receivedQuantity}) => (receivedQuantity > 0)));
    }


    public updateToTreatList(toTreatReferences: Array<ReceptionReferenceArticle>): void {
        this.listToTreatConfig = {
            header: {
                title: 'A Réceptionner',
                info: `${toTreatReferences.length} référence${toTreatReferences.length > 1 ? 's' : ''}`,
                leftIcon: {
                    name: 'download.svg',
                    color: 'list-pink-light',
                },
                rightIcon: [
                    {
                        color: 'primary',
                        name: 'scan-photo.svg',
                        action: () => {
                            this.footerScannerComponent.scan();
                        }
                    },
                ]
            },
            body: toTreatReferences.map((reference) => ({
                infos: {
                    reference: {
                        label: 'Référence',
                        value: reference.reference,
                        emergency: reference.emergency,
                    },
                    quantityToReceive: {
                        label: 'Quantité attendue',
                        value: `${reference.remainingQuantity || 0}`,
                    },
                },
                rightIcon: {
                    color: 'grey' as IconColor,
                    name: 'up.svg',
                    action: () => {
                        this.takeReferenceArticleQuantity(reference);
                    },
                },
            })),
        };
    }

    public updateTreatedList(treatedReferences: Array<ReceptionReferenceArticle>): void {
        this.listTreatedConfig = {
            header: {
                title: 'Réceptionné',
                info: `${treatedReferences.length} référence${treatedReferences.length > 1 ? 's' : ''}`,
                leftIcon: {
                    name: 'upload.svg',
                    color: 'list-pink',
                },
            },
            body: treatedReferences.map((reference) => ({
                infos: {
                    reference: {
                        label: 'Référence',
                        value: reference.reference,
                        emergency: reference.emergency,
                    },
                    quantityToReceive: {
                        label: 'Quantité attendue',
                        value: `${reference.quantityToReceive}`,
                    },
                    receivedQuantity: {
                        label: 'Quantité reçue',
                        value: `${reference.receivedQuantity}`,
                    },
                },
                rightIcon: {
                    color: 'danger' as IconColor,
                    name: 'trash.svg',
                    action: () => {
                        this.removeTreatedReferences(reference);
                        this.updateViewLists();
                    },
                },
            })),
        };
    }

    private removeTreatedReferences(reference: ReceptionReferenceArticle): void {
        reference.receivedQuantity = 0;
        reference.remainingQuantity = reference.quantityToReceive;
    }

    public takeReferenceArticleQuantity(reference: ReceptionReferenceArticle){
        this.navService.push(NavPathEnum.RECEPTION_REFERENCE_TAKE, {
            reference,
            selectReference: (selectedQuantity: number) => {
                const newReceivedQuantity = (reference.receivedQuantity || 0) + selectedQuantity;
                if (newReceivedQuantity <= reference.quantityToReceive) {
                    reference.receivedQuantity = selectedQuantity;
                    reference.remainingQuantity = (reference.quantityToReceive - newReceivedQuantity);
                    this.updateViewLists();
                }
                else {
                    this.toastService.presentToast(`La quantité attendue pour cette référence est de ${reference.quantityToReceive}`);
                }
            },
        });
    }
}
