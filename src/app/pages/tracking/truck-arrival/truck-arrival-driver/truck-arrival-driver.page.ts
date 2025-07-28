import {Component, ViewChild} from '@angular/core';
import {NavService} from '@app/services/nav/nav.service';
import {FormPanelParam} from "@common/directives/form-panel/form-panel-param";
import {
    FormPanelSelectComponent
} from "@common/components/panel/form-panel/form-panel-select/form-panel-select.component";
import {SelectItemTypeEnum} from "@common/components/select-item/select-item-type.enum";
import {FormPanelComponent} from "@common/components/panel/form-panel/form-panel.component";
import {SqliteService} from "@app/services/sqlite/sqlite.service";
import {ToastService} from "@app/services/toast.service";
import {
    FormPanelInputComponent
} from "@common/components/panel/form-panel/form-panel-input/form-panel-input.component";
import {StorageService} from "@app/services/storage/storage.service";
import {Emplacement} from "@entities/emplacement";
import {ApiService} from "@app/services/api.service";
import {LoadingService} from "@app/services/loading.service";
import {Driver} from "@entities/driver";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";
import {Carrier} from "@entities/carrier";
import {zip} from "rxjs";
import {ViewWillEnter} from "@ionic/angular";

@Component({
    selector: 'wii-truck-arrival-driver',
    templateUrl: './truck-arrival-driver.page.html',
    styleUrls: ['./truck-arrival-driver.page.scss'],
})
export class TruckArrivalDriverPage implements ViewWillEnter {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public bodyConfig: Array<FormPanelParam> | any;

    public truckArrivalDefaultUnloadingLocationId: number;

    public truckArrivalUnloadingLocationId: number;

    public truckArrivalUnloadingLocation: Emplacement;

    public driver?: Driver;
    public carrier: Carrier;
    public popOnBack: boolean = false;

    private fieldParams: {
        displayDriver: boolean,
        needsDriver: boolean,
        displayRegistrationNumber: boolean,
        needsRegistrationNumber: boolean,
        displayUnloadingLocation: boolean,
        needsUnloadingLocation: boolean,
        displaySupplier: boolean,
        needsSupplier: boolean,
        displayOrderNumber: boolean,
        needsOrderNumber: boolean

    } = {
        displayDriver: false,
        needsDriver: false,
        displayRegistrationNumber: false,
        needsRegistrationNumber: false,
        displayUnloadingLocation: false,
        needsUnloadingLocation: false,
        displaySupplier: false,
        needsSupplier: false,
        displayOrderNumber: false,
        needsOrderNumber: false
    };

    public constructor(private navService: NavService,
                       public sqliteService: SqliteService,
                       public apiService: ApiService,
                       public loadingService: LoadingService,
                       public storageService: StorageService,
                       public toastService: ToastService) {
    }

    public ionViewWillEnter(): void {
        this.carrier = this.navService.param('carrier') ?? null;

        if(this.popOnBack) {
            this.popOnBack = false;
            this.navService.pop();
        } else {
            this.loadingService.presentLoadingWhile({
                event: () => {
                    return zip(
                        this.apiService.requestApi(ApiService.GET_TRUCK_ARRIVALS_DEFAULT_UNLOADING_LOCATION),

                        this.storageService.getNumber('truckArrival.driver.displayedCreate'),
                        this.storageService.getNumber('truckArrival.driver.requiredCreate'),
                        this.storageService.getNumber('truckArrival.registrationNumber.displayedCreate'),
                        this.storageService.getNumber('truckArrival.registrationNumber.requiredCreate'),
                        this.storageService.getNumber('truckArrival.unloadingLocation.displayedCreate'),
                        this.storageService.getNumber('truckArrival.unloadingLocation.requiredCreate'),
                        this.storageService.getNumber('truckArrival.supplier.displayedCreate'),
                        this.storageService.getNumber('truckArrival.supplier.requiredCreate'),
                        this.storageService.getNumber('truckArrival.orderNumber.displayedCreate'),
                        this.storageService.getNumber('truckArrival.orderNumber.requiredCreate'),
                    )
                }
            }).subscribe(([defaultUnloadingLocationId, ...fieldParams]) => {
                const [
                    displayDriver,
                    needsDriver,
                    displayRegistrationNumber,
                    needsRegistrationNumber,
                    displayUnloadingLocation,
                    needsUnloadingLocation,
                    displaySupplier,
                    needsSupplier,
                    displayOrderNumber,
                    needsOrderNumber
                ] = fieldParams;

                this.truckArrivalDefaultUnloadingLocationId = defaultUnloadingLocationId;

                if(!displayDriver && !displayUnloadingLocation && !displayRegistrationNumber && !displaySupplier && !displayOrderNumber){
                    this.popOnBack = true;
                    this.next();
                }

                this.fieldParams = {
                    displayDriver: Boolean(displayDriver),
                    needsDriver: Boolean(needsDriver),
                    displayRegistrationNumber: Boolean(displayRegistrationNumber),
                    needsRegistrationNumber: Boolean(needsRegistrationNumber),
                    displayUnloadingLocation: Boolean(displayUnloadingLocation),
                    needsUnloadingLocation: Boolean(needsUnloadingLocation),
                    displaySupplier: Boolean(displaySupplier),
                    needsSupplier: Boolean(needsSupplier),
                    displayOrderNumber: Boolean(displayOrderNumber),
                    needsOrderNumber: Boolean(needsOrderNumber)
                };

                this.generateForm();
            });
        }
    }

    public generateForm() {
        this.bodyConfig = [
            ...(this.fieldParams.displayDriver
                ? [{
                    item: FormPanelSelectComponent,
                    config: {
                        label: 'Chauffeur',
                        name: 'driver',
                        inputConfig: {
                            searchType: SelectItemTypeEnum.DRIVER,
                            requestParams: [`id_transporteur = ${this.carrier.id}`],
                            onChange: (driverId: any) => {
                                this.sqliteService
                                    .findOneBy('driver', {id: driverId})
                                    .subscribe((selectedDriver?: Driver) => {
                                        this.driver = selectedDriver;
                                    })
                            },
                            required: Boolean(this.fieldParams.needsDriver),
                        },
                        errors: {
                            required: 'Vous devez sélectionner un chauffeur.'
                        }
                    }
                }]
                : []),
            ...(this.fieldParams.displayRegistrationNumber
                ? [
                    {
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Immatriculation',
                            name: 'registrationNumber',
                            inputConfig: {
                                type: 'text',
                                required: Boolean(this.fieldParams.needsRegistrationNumber)
                            },
                            errors: {
                                required: 'Veuillez renseigner une immatriculation.',
                            }
                        }
                    }
                ]
                : []),
            ...(this.fieldParams.displayUnloadingLocation ?
                [{
                    item: FormPanelSelectComponent,
                    config: {
                        label: 'Emplacement',
                        name: 'unloadingLocation',
                        value: this.truckArrivalDefaultUnloadingLocationId ?? null,
                        inputConfig: {
                            required: Boolean(this.fieldParams.needsUnloadingLocation),
                            searchType: SelectItemTypeEnum.LOCATION,
                            onChange: (unloadingLocationId: any) => {
                                this.truckArrivalUnloadingLocationId = unloadingLocationId;
                            }
                        },
                        section: {
                            title: 'Emplacement de déchargement',
                            bold: true,
                        },
                        errors: {
                            required: 'Vous devez sélectionner un emplacement de déchargement.'
                        }
                    }
                }]
                : []),
            ...(this.fieldParams.displaySupplier
                ? [{
                    item: FormPanelSelectComponent,
                    config: {
                        label: 'Fournisseur',
                        name: 'supplier',
                        inputConfig: {
                            searchType: SelectItemTypeEnum.SUPPLIER,
                            onChange: (supplierId: any) => {
                                this.sqliteService
                                    .findOneBy('supplier', {id: supplierId})
                                    .subscribe((selectedSupplier?: any) => {
                                        // this.supplier = selectedSupplier;
                                    })
                            },
                            required: Boolean(this.fieldParams.needsSupplier),
                        },
                        errors: {
                            required: 'Vous devez sélectionner un fournisseur.'
                        }
                    }
                }]
                : []),
            ...(this.fieldParams.displayOrderNumber
                ? [
                    {
                        item: FormPanelInputComponent,
                        config: {
                            label: 'N° de commande',
                            name: 'orderNumber',
                            inputConfig: {
                                type: 'text',
                                required: Boolean(this.fieldParams.needsOrderNumber)
                            },
                            errors: {
                                required: 'Veuillez renseigner un N° de commande.',
                            }
                        }
                    }
                ]
                : []),
        ];
    }

    public next() {
        const firstError = this.formPanelComponent.firstError;
        if(firstError){
            this.toastService.presentToast(firstError);
        } else {
            const {registrationNumber, supplier, orderNumber} = this.formPanelComponent.values;
            this.sqliteService.findOneById('emplacement', this.truckArrivalUnloadingLocationId || this.truckArrivalDefaultUnloadingLocationId).subscribe((unloadingLocation) => {
                this.truckArrivalUnloadingLocation = unloadingLocation;
                this.navService.push(NavPathEnum.TRUCK_ARRIVAL_LINES, {
                    truckArrivalUnloadingLocation: this.truckArrivalUnloadingLocation,
                    driver: this.driver,
                    carrier: this.carrier,
                    registrationNumber,
                    supplier,
                    orderNumber
                });
            });
        }
    }
}
