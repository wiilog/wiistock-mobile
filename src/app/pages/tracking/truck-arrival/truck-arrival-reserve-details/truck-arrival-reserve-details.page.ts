import {Component, ViewChild} from '@angular/core';
import {NavService} from '@app/services/nav/nav.service';
import {FormPanelComponent} from "@common/components/panel/form-panel/form-panel.component";
import {FormPanelParam} from "@common/directives/form-panel/form-panel-param";
import {
    FormPanelInputComponent
} from "@common/components/panel/form-panel/form-panel-input/form-panel-input.component";
import {
    FormPanelCameraComponent
} from "@common/components/panel/form-panel/form-panel-camera/form-panel-camera.component";
import {TabConfig} from "@common/components/tab/tab-config";
import {ViewWillEnter} from "@ionic/angular";


enum QuantityType {
    MINUS = 1,
    PLUS = 2,
}

@Component({
    selector: 'wii-truck-arrival-reserve-details',
    templateUrl: './truck-arrival-reserve-details.page.html',
    styleUrls: ['./truck-arrival-reserve-details.page.scss'],
})
export class TruckArrivalReserveDetailsPage implements ViewWillEnter {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public QUALITY = 'quality';
    public QUANTITY = 'quantity';

    public defaultQuantityType = QuantityType.MINUS;

    public WII_INPUT_NUMBER_LABEL = "Ecart quantité";

    public loading: boolean;

    public reserveDetailsListConfig: Array<FormPanelParam>;

    public reserveType?: string;

    public tabConfig: TabConfig[] = [
        { label: 'En moins', key: QuantityType.MINUS },
        { label: 'En plus', key: QuantityType.PLUS }
    ];

    public truckArrivalLine?: {
        number?: string;
        reserve?: {
            type?: string;
            comment?: string;
            photos?: Array<string>;
        }
    };

    public reserve: {
        type?: string;
        quantity?: number;
        quantityType?: string
    };

    public newReserve?: boolean;

    public afterValidate: (data: any) => void;

    public constructor(private navService: NavService) {}

    public ionViewWillEnter(): void {
        this.loading = false;
        this.truckArrivalLine = this.navService.param('truckArrivalLine') ?? [];
        this.newReserve = this.navService.param('newReserve') ?? true;
        this.reserveType = this.navService.param('type');
        this.afterValidate = this.navService.param('afterValidate');

        this.reserve = {};
        this.generateReserveDetails();
    }

    public generateReserveDetails(){
        if (this.reserveType === this.QUALITY){
            this.reserveDetailsListConfig = [
                {
                    item: FormPanelInputComponent,
                    config: {
                        label: 'N° tracking transporteur',
                        value: this.truckArrivalLine?.number,
                        name: 'truckArrivalLineNumber',
                        inputConfig: {
                            type: 'text',
                        },
                        section: {
                            title: 'Réserve qualité ',
                            bold: true,
                            logo: 'emergency.svg',
                        }
                    }
                },
                {
                    item: FormPanelCameraComponent,
                    config: {
                        label: 'Photo(s)',
                        name: 'photos',
                        value: !this.newReserve ? this.truckArrivalLine?.reserve?.photos : '',
                        inputConfig: {
                            multiple: true
                        }
                    }
                },
                {
                    item: FormPanelInputComponent,
                    config: {
                        label: 'Commentaire',
                        value: !this.newReserve ? this.truckArrivalLine?.reserve?.comment   : '',
                        name: 'qualityComment',
                        inputConfig: {
                            type: 'text',
                        },
                    }
                },
            ];
        } else if (this.reserveType === this.QUANTITY) {
            this.reserveDetailsListConfig = [
                {
                    item: FormPanelInputComponent,
                        config: {
                        label: 'Commentaire',
                        value: !this.newReserve ? this.truckArrivalLine?.reserve?.comment   : '',
                        name: 'quantityComment',
                        inputConfig: {
                            type: 'text',
                        },
                    }
                },
            ];
        }
    }

    public deleteReserve(){
        this.navService.pop().subscribe(() => {
            this.afterValidate({
                delete: true,
            });
        });
    }

    public setReserveQuantity(value?: number){
        this.reserve.quantity = value;
    }

    public onChangeQuantityType(value: any){
        this.reserve.quantityType =
            value === QuantityType.MINUS
                ? 'minus'
                : (value === QuantityType.PLUS
                    ? 'plus' : '');
    }

    public validate() {
        let data = {};
        if(this.reserveType === this.QUALITY){
            const {photos, qualityComment} = this.formPanelComponent.values;

            data = {photos, comment: qualityComment};
        } else if(this.reserveType === this.QUANTITY) {
            const {quantityComment} = this.formPanelComponent.values;

            data = {
                comment: quantityComment,
                quantity: this.reserve.quantity,
                quantityType: this.reserve.quantityType,
            };
        }

        this.navService.pop().subscribe(() => {
            this.afterValidate(data);
        });
    }
}
