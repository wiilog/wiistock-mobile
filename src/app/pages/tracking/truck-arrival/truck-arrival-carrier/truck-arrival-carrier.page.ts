import {Component, ViewChild} from '@angular/core';
import {NavService} from '@app/services/nav/nav.service';
import {FormPanelParam} from '@common/directives/form-panel/form-panel-param';
import {
    FormPanelSelectComponent
} from '@common/components/panel/form-panel/form-panel-select/form-panel-select.component';
import {SelectItemTypeEnum} from '@common/components/select-item/select-item-type.enum';
import {FormPanelComponent} from '@common/components/panel/form-panel/form-panel.component';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {ToastService} from '@app/services/toast.service';
import {Carrier} from '@entities/carrier';
import {ApiService} from '@app/services/api.service';
import {NetworkService} from '@app/services/network.service';
import {LoadingService} from '@app/services/loading.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {BarcodeScannerComponent} from '@common/components/barcode-scanner/barcode-scanner.component';
import {BarcodeScannerModeEnum} from '@common/components/barcode-scanner/barcode-scanner-mode.enum';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {MainHeaderService} from "@app/services/main-header.service";
import {ViewWillEnter} from "@ionic/angular";

@Component({
    selector: 'wii-truck-arrival-carrier',
    templateUrl: './truck-arrival-carrier.page.html',
    styleUrls: ['./truck-arrival-carrier.page.scss'],
})
export class TruckArrivalCarrierPage implements ViewWillEnter {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.INVISIBLE;

    private afterNext: (values: any) => void;

    public bodyConfig: Array<FormPanelParam>;

    public carrier?: Carrier;

    public carriers: Array<Carrier>;


    public constructor(private navService: NavService,
                       private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private networkService: NetworkService,
                       private loadingService: LoadingService,
                       private localDataService: LocalDataManagerService,
                       private apiService: ApiService,
                       private mainHeaderService: MainHeaderService) {
    }

    public ionViewWillEnter(): void {
        this.footerScannerComponent.fireZebraScan();
        this.mainHeaderService.emitSubTitle('Etape 1/4');

        this.afterNext = this.navService.param('afterNext');
        this.carrier = this.navService.param('carrier');
        this.generateForm();
        this.synchronise();
    }

    public synchronise(): void {
        this.loadingService.presentLoadingWhile({
            event: () => this.sqliteService.findBy('carrier', [
                'recurrent = 1'
            ])
        }).subscribe((carriers) => {
            this.carriers = carriers;
        });
    }

    public generateForm() {
        this.bodyConfig = [
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Transporteur',
                    name: 'carrier',
                    value: this.carrier?.id,
                    inputConfig: {
                        searchType: SelectItemTypeEnum.CARRIER,
                        onChange: (carrierId: any) => {
                            this.sqliteService
                                .findOneBy(`carrier`, {id: carrierId})
                                .subscribe((newCarrier?: Carrier) => {
                                    this.carrier = newCarrier;
                                })
                        }
                    },
                }
            },
        ]
    }

    public next() {
        if (this.carrier) {
            this.footerScannerComponent.unsubscribeZebraScan();
            this.navService.push(NavPathEnum.TRUCK_ARRIVAL_DRIVER, {
                carrier: this.carrier
            });
        } else {
            this.toastService.presentToast('Veuillez sélectionner un transporteur.');
        }
    }

    public onLogoClick(event: Event, id: number) {
        this.carrier = this.carriers.find(carrier => carrier.id === id);
    }

    public testIfBarcodeEquals(text: string) {
        const carrier = this.carriers.find(carrierI => (carrierI.label === text));
        if (carrier) {
            this.carrier = carrier;
            this.next();
        } else {
            this.toastService.presentToast('Le transporteur scanné n\'est pas dans la liste.');
        }
    }
}
