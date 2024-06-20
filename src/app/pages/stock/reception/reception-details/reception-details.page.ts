import {Component, ViewChild} from '@angular/core';
import {ViewWillEnter} from "@ionic/angular";
import * as moment from 'moment';
import {ApiService} from "@app/services/api.service";
import {NavService} from "@app/services/nav/nav.service";
import {HeaderConfig} from "@common/components/panel/model/header-config";
import {ListPanelItemConfig} from "@common/components/panel/model/list-panel/list-panel-item-config";
import {IconColor} from "@common/components/icon/icon-color";
import {FormPanelComponent} from "@common/components/panel/form-panel/form-panel.component";
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";

@Component({
    selector: 'wii-reception-details',
    templateUrl: './reception-details.page.html',
    styleUrls: ['./reception-details.page.scss'],
})
export class ReceptionDetailsPage implements ViewWillEnter {
    public hasLoaded: boolean;
    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.TOOL_SEARCH;

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

    private receptionContent: Array<{ label: string; value: string; }> = [];

    public receptionHeaderConfig: HeaderConfig;

    public constructor(private apiService: ApiService,
                       private navService: NavService) {}

    public ionViewWillEnter(): void {
        this.hasLoaded = false;
        this.reception = this.navService.param('reception');
        this.receptionContent = this.navService.param('content');

        this.listBoldValues = ['reference', 'quantityToReceive', 'receivedQuantity'];

        this.receptionContent.push(
            {
                label: 'Date de commande',
                value: this.reception.orderDate
                    ? moment(this.reception.orderDate.date, 'YYYY-MM-DD HH:mm:ss.SSSSSS').format('DD/MM/YYYY')
                    : '',
            },{
                label: 'Commentaire',
                value: this.reception.comment,
            }
        );

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
                            references: Array<{
                                barcode: string;
                                comment: string;
                                emergency: boolean;
                                id: number;
                                orderNumber: string;
                                quantityToReceive: number;
                                receivedQuantity: number;
                                reference: string;
                                unitPrice: number;
                            }>;
                        }>
                    }

                }) => {
                    if (response.success) {
                        let listToTreatConfigBody: Array<ListPanelItemConfig> = [];
                        let listTreatedConfigBody: Array<ListPanelItemConfig> = [];
                        response.data.data?.forEach((line) => {
                            line.references?.forEach((reference) => {
                                const remainingQuantityToReceive: number = reference.quantityToReceive - (reference.receivedQuantity || 0);
                                if(remainingQuantityToReceive > 0) {
                                    listToTreatConfigBody.push({
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
                                                console.log('click '); // TODO
                                            },
                                        },
                                    });
                                }

                                if(reference.receivedQuantity > 0){
                                    listTreatedConfigBody.push({
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
                                                console.log('click trash'); // TODO
                                            },
                                        },
                                    });
                                }
                            });
                        });

                        this.listToTreatConfig = {
                            header: {
                                title: 'A Réceptionner',
                                info: `${listToTreatConfigBody.length} référence${listToTreatConfigBody.length > 1 ? 's' : ''}`,
                                leftIcon: {
                                    name: 'download.svg',
                                    color: 'list-pink-light',
                                },
                            },
                            body: listToTreatConfigBody,
                        }

                        this.listTreatedConfig = {
                            header: {
                                title: 'Collecté',
                                info: `${listTreatedConfigBody.length} référence${listTreatedConfigBody.length > 1 ? 's' : ''}`,
                                leftIcon: {
                                    name: 'upload.svg',
                                    color: 'list-pink',
                                },
                            },
                            body: listTreatedConfigBody,
                        };
                    }
                },
            });

        this.hasLoaded = true;
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
        console.log('testIfBarcodeEquals'); // TODO
    }

    protected readonly console = console;
}
