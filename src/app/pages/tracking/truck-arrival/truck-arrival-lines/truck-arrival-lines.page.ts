import {Component, ViewChild} from '@angular/core';
import {NavService} from '@app/services/nav/nav.service';
import {FormPanelComponent} from "@common/components/panel/form-panel/form-panel.component";
import {SqliteService} from "@app/services/sqlite/sqlite.service";
import {ToastService} from "@app/services/toast.service";
import {StorageService} from "@app/services/storage/storage.service";
import {Emplacement} from "@entities/emplacement";
import {ApiService} from "@app/services/api.service";
import {LoadingService} from "@app/services/loading.service";
import {MainHeaderService} from "@app/services/main-header.service";
import {ListPanelItemConfig} from "@common/components/panel/model/list-panel/list-panel-item-config";
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {BarcodeScannerComponent} from "@common/components/barcode-scanner/barcode-scanner.component";
import {AlertService} from "@app/services/alert.service";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";
import {Carrier} from "@entities/carrier";
import {ViewWillEnter} from "@ionic/angular";

@Component({
    selector: 'wii-truck-arrival-lines',
    templateUrl: './truck-arrival-lines.page.html',
    styleUrls: ['./truck-arrival-lines.page.scss'],
})
export class TruckArrivalLinesPage implements ViewWillEnter {

    public readonly scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.WITH_MANUAL;

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public loading: boolean;

    public truckArrivalUnloadingLocation: Emplacement;

    public driver?: { id: number; label: string; prenom: string; id_transporteur: number };

    public carrier: Carrier;

    public registrationNumber?: string;

    public truckArrivalLinesListConfig?: Array<ListPanelItemConfig>;

    public truckArrivalLinesNumber?: Array<{
        id: number;
        number: string;
        disableTrackingNumber?: boolean;
    }>;

    public truckArrivalLines?: Array<{
        number: string;
        reserve?: {
            reserveTypeId?: number;
            comment?: string;
            photos?: Array<string>;
        }
    }> = [];

    private loaded: boolean = false;

    public constructor(private navService: NavService,
                       public sqliteService: SqliteService,
                       public apiService: ApiService,
                       public loadingService: LoadingService,
                       public storageService: StorageService,
                       public toastService: ToastService,
                       public alertService: AlertService,
                       private mainHeaderService: MainHeaderService) {
    }

    public ionViewWillEnter(): void {

        // if first initialisation
        if(!this.loaded) {
            this.carrier = this.navService.param('carrier') ?? null;
            this.driver = this.navService.param('driver') ?? null;
            this.truckArrivalUnloadingLocation = this.navService.param('truckArrivalUnloadingLocation') ?? [];
            this.registrationNumber = this.navService.param('registrationNumber') ?? null;
        }

        this.loadingService.presentLoadingWhile({
            event: () => this.apiService.requestApi(ApiService.GET_TRUCK_ARRIVALS_LINES_NUMBER, {})
        }).subscribe((truckArrivalLineNumbers) => {
            this.loading = false;
            this.loaded = true;
            this.truckArrivalLinesNumber = truckArrivalLineNumbers;
            this.refreshTruckArrivalLinesCards();
        });
    }

    public refreshTruckArrivalLinesCards() {
        this.truckArrivalLinesListConfig = (this.truckArrivalLines || []).map((line) => (
            {
                infos: {
                    label: {
                        value: line.number,
                        emergency: Boolean(line.reserve) || false,
                    },
                },
                leftIcon: {
                    name: 'trash.svg',
                    color: 'danger',
                    action: () => {
                        this.removeTruckArrivalLine(line.number)
                    }
                },
                rightButton: {
                    text: 'Réserve',
                    action: () => {
                        this.navService.push(NavPathEnum.TRUCK_ARRIVAL_RESERVE_DETAILS, {
                            truckArrivalLine: line,
                            newReserve: !Boolean(line.reserve),
                            kind: 'line',
                            afterValidate: (data: any) => {
                                if(data.delete){
                                    line.reserve = undefined;
                                } else {
                                    line.reserve = {
                                        photos: data.photos,
                                        comment: data.comment,
                                        reserveTypeId: data.reserveTypeId,
                                    };
                                }
                                this.refreshTruckArrivalLinesCards();
                            }
                        });
                    }
                }
            }));
    }

    public testIfBarcodeEquals(truckArrivalLineNumber: string): void {
        if (this.carrier) {
            if (this.carrier?.minTrackingNumberLength !== undefined
                && this.carrier?.maxTrackingNumberLength !== undefined
                && (
                    truckArrivalLineNumber.length < this.carrier.minTrackingNumberLength
                    || truckArrivalLineNumber.length > this.carrier.maxTrackingNumberLength
                )) {
                const message = Boolean(this.carrier.minTrackingNumberLength) && Boolean(this.carrier.maxTrackingNumberLength)
                    ? `Le numéro de tracking transporteur doit contenir entre ${this.carrier.minTrackingNumberLength} et ${this.carrier.maxTrackingNumberLength} caractères, voulez vous l'utiliser quand même ?`
                    : (Boolean(this.carrier.minTrackingNumberLength) && truckArrivalLineNumber.length < this.carrier.minTrackingNumberLength
                        ? `Le numéro de tracking transporteur doit contenir au moins ${this.carrier.minTrackingNumberLength} caractères, voulez vous l'utiliser quand même ?`
                        : (Boolean(this.carrier.maxTrackingNumberLength) && truckArrivalLineNumber.length > this.carrier.maxTrackingNumberLength
                            ? `Le numéro de tracking transporteur doit contenir au maximum ${this.carrier.maxTrackingNumberLength} caractères, voulez vous l'utiliser quand même ?`
                            : ''));
                if (message) {
                    this.alertService.show({
                        header: '',
                        message,
                        buttons: [{
                            text: 'Confirmer',
                            cssClass: 'alert-success',
                            handler: () => {
                                this.checkIfAlreadyExist(truckArrivalLineNumber);
                            }
                        }, {
                            text: 'Annuler',
                            cssClass: 'alert-danger',
                            role: 'cancel',
                        }]
                    });
                } else {
                    this.checkIfAlreadyExist(truckArrivalLineNumber);
                }
            }
            else {
                this.checkIfAlreadyExist(truckArrivalLineNumber);
            }
        }
    }

    public checkIfAlreadyExist(truckArrivalLineNumber: string) {
        if (this.truckArrivalLines && this.truckArrivalLinesNumber) {
            const alreadyAddedToList = this.truckArrivalLines.findIndex((line) => line.number === truckArrivalLineNumber) !== -1;
            const alreadyExistInDatabaseAndDisabled = this.truckArrivalLinesNumber
                .filter(({number}) => number === truckArrivalLineNumber)
                .sort((a,b) => a.id < b.id ? 1 : -1)[0];

            if (!alreadyAddedToList && ((alreadyExistInDatabaseAndDisabled && alreadyExistInDatabaseAndDisabled.disableTrackingNumber) || !alreadyExistInDatabaseAndDisabled)) {
                this.truckArrivalLines.unshift({
                    number: truckArrivalLineNumber,
                });
            } else {
                this.alertService.show({
                    header: '',
                    message: alreadyAddedToList
                        ? 'Vous avez déjà scanné ce numéro de tracking transporteur.'
                        : (alreadyExistInDatabaseAndDisabled && !alreadyExistInDatabaseAndDisabled.disableTrackingNumber
                            ? 'Vous avez déjà ajouté ce numéro de tracking transporteur à un autre arrivage camion'
                            : ''),
                    buttons: [{
                        text: 'OK',
                        cssClass: 'alert-success'
                    }]
                });
            }

            this.refreshTruckArrivalLinesCards();
        }
    }

    public removeTruckArrivalLine(truckArrivalLineNumber: string){
        if (this.truckArrivalLines) {
            const selectedLinesToDelete = this.truckArrivalLines.findIndex((line) => line.number === truckArrivalLineNumber);
            this.truckArrivalLines.splice(selectedLinesToDelete, 1);

            this.refreshTruckArrivalLinesCards();
        }
    }

    public next() {
        if (this.truckArrivalLines) {
            if (this.truckArrivalLines.length > 0) {
                this.navService.push(NavPathEnum.TRUCK_ARRIVAL_RESERVES, {
                    truckArrivalUnloadingLocation: this.truckArrivalUnloadingLocation,
                    driver: this.driver,
                    carrier: this.carrier,
                    registrationNumber: this.registrationNumber,
                    truckArrivalLines: this.truckArrivalLines,
                });
            } else {
                this.toastService.presentToast('Veuillez renseigner au moins un numéro de tracking transporteur.');
            }
        }
    }
}
