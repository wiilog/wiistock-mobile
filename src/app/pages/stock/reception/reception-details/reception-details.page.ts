import {Component, OnInit, ViewChild} from '@angular/core';
import * as moment from 'moment';
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

@Component({
    selector: 'wii-reception-details',
    templateUrl: './reception-details.page.html',
    styleUrls: ['./reception-details.page.scss'],
})
export class ReceptionDetailsPage implements OnInit {
    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public hasLoaded: boolean;
    public readonly barcodeScannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.INVISIBLE;

    public reception: {
        id: number,
        number: string,
        status: string,
        supplier: string,
        orderNumber: Array<string>,
        expectedDate: string,
        location: string,
        comment: string,
        carrier: string,
        user: string,
        orderDate: {
            date: string,
        },
        storageLocation: string
    };

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public listToTreatConfig?: { header: HeaderConfig; body: Array<ListPanelItemConfig>; };
    public listTreatedConfig?: { header: HeaderConfig; body: Array<ListPanelItemConfig>; };
    public listBoldValues?: Array<string>;

    public listToTreatConfigBody: Array<ListPanelItemConfig> = [];
    public listTreatedConfigBody: Array<ListPanelItemConfig> = [];

    private receptionContent: Array<{ label: string; value: string; }> = [];

    public receptionHeaderConfig: HeaderConfig;

    public started: boolean = false;

    public receptionReferenceArticles: Array<ReceptionReferenceArticle> = [];
    public constructor(private apiService:   ApiService,
                       private toastService: ToastService,
                       private navService:   NavService) {}

    public ngOnInit(): void {
        this.hasLoaded = false;
        this.reception = this.navService.param('reception');
        this.receptionContent = this.navService.param('content');

        this.listBoldValues = ['reference', 'quantityToReceive', 'receivedQuantity'];

        this.refreshHeader(false);

        this
            .apiService.requestApi(ApiService.GET_RECEPTION_LINES, {
                pathParams: {
                    reception: this.reception.id
                }
            })
            .subscribe({
                next: (response: {
                    success: any;
                    data: {
                        total: number;
                        data: Array<{
                            id: number;
                            pack: number;
                            references: Array<ReceptionReferenceArticle>;
                        }>
                    }
                }) => {
                    if (response.success) {
                        this.listToTreatConfigBody = [];
                        this.listTreatedConfigBody = [];
                        response.data.data?.forEach((line) => {
                            this.receptionReferenceArticles = line.references;
                            line.references?.forEach((reference) => {
                                this.updateViewLists(reference);
                            });
                        });

                        if (this.listTreatedConfigBody.length > 0) {
                            this.started = true;
                        }

                        this.updateListsCounter();
                    }
                    this.hasLoaded = true;
                },
            });

        if (this.footerScannerComponent) {
            this.footerScannerComponent.fireZebraScan();
        }
    }


    public refreshHeader(opened: boolean){
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
            subtitle: [
                ...this.receptionContent.map((content: { label: string; value: string; }) => `${content.label}: ${content.value}`),
                `Date de commande : ${this.reception.orderDate ? moment(this.reception.orderDate.date, 'YYYY-MM-DD HH:mm:ss.SSSSSS').format('DD/MM/YYYY') : ''}`,
                `Commentaire : ${this.reception.comment || ''}`,
            ].filter((item) => item) as Array<string>
        };
    }
    public validate(): void {
        console.log('validate') // TODO
    }

    public testIfBarcodeEquals(text: string): void {
        const selectedLineTake = this.receptionReferenceArticles.findIndex((reference) => reference.barCode === text);

        if(selectedLineTake === -1){
            this.toastService.presentToast('Le code barre scanné ne correspond à aucune référence présente dans cette réception.');
        } else {
            this.takeReferenceArticleQuantity(this.receptionReferenceArticles[selectedLineTake]);
        }

    }

    public updateViewLists(reference: ReceptionReferenceArticle): void{
        this.toTreatList(reference);
        this.treatedList(reference);
    }


    public toTreatList(reference: ReceptionReferenceArticle): void{
        const remainingQuantityToReceive: number = reference.quantityToReceive - (reference.receivedQuantity || 0);
        if(remainingQuantityToReceive > 0) {
            this.listToTreatConfigBody.push({
                infos: {
                    reference: {
                        label: 'Référence',
                        value: reference.reference,
                        emergency: reference.emergency,
                    },
                    quantityToReceive: {
                        label: 'Quantité attendue',
                        value: `${remainingQuantityToReceive}`,
                    },
                },
                rightIcon: {
                    color: 'grey' as IconColor,
                    name: 'up.svg',
                    action: () => {
                        this.takeReferenceArticleQuantity(reference);
                    },
                },
            });
        } else {
            this.moveReference(reference, this.listToTreatConfigBody);
        }
    }

    public treatedList(reference: ReceptionReferenceArticle): void{
        if(reference.receivedQuantity > 0){
            this.listTreatedConfigBody.push({
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
                        reference.receivedQuantity = 0;
                        this.updateViewLists(reference);
                        this.updateListsCounter();
                    },
                },
            });
        } else {
            this.moveReference(reference, this.listTreatedConfigBody);
        }
    }

    public moveReference(reference: ReceptionReferenceArticle, listToUpdate: Array<ListPanelItemConfig>): void{
        const selectedLinesToDelete = listToUpdate.findIndex((line) => line?.infos?.reference?.value === reference.reference);
        listToUpdate.splice(selectedLinesToDelete, 1);
    }


    public updateListsCounter(): void {
        this.listToTreatConfig = {
            header: {
                title: 'A Réceptionner',
                info: `${this.listToTreatConfigBody.length} référence${this.listToTreatConfigBody.length > 1 ? 's' : ''}`,
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
            body: this.listToTreatConfigBody,
        }

        this.listTreatedConfig = {
            header: {
                title: 'Collecté',
                info: `${this.listTreatedConfigBody.length} référence${this.listTreatedConfigBody.length > 1 ? 's' : ''}`,
                leftIcon: {
                    name: 'upload.svg',
                    color: 'list-pink',
                },
            },
            body: this.listTreatedConfigBody,
        };
    }

    public takeReferenceArticleQuantity(reference: ReceptionReferenceArticle){
        //TODO faire ce traitement uniquement si reference scannée est dans la liste A Receptionner
        this.navService.push(NavPathEnum.RECEPTION_REFERENCE_TAKE, {
            reference,
            started: this.started,
            selectReference: (selectedQuantity: number) => {
                reference.receivedQuantity = selectedQuantity;
                this.moveReference(reference, this.listToTreatConfigBody);
                this.updateViewLists(reference);
                this.updateListsCounter();
            },
        });
    }

    protected readonly console = console;
}
