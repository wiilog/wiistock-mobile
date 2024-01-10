import {Component, ViewChild} from '@angular/core';
import {NavService} from '@app/services/nav/nav.service';
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {ToastService} from '@app/services/toast.service';
import {BarcodeScannerComponent} from "@common/components/barcode-scanner/barcode-scanner.component";
import {LoadingService} from "@app/services/loading.service";
import {HeaderConfig} from "@common/components/panel/model/header-config";
import {ListPanelItemConfig} from "@common/components/panel/model/list-panel/list-panel-item-config";
import {ApiService} from "@app/services/api.service";
import {ViewWillEnter} from "@ionic/angular";
import {NetworkService} from '@app/services/network.service';

@Component({
    selector: `wii-receipt-association-logistic-unit`,
    templateUrl: `./receipt-association-logistic-unit.page.html`,
    styleUrls: [`./receipt-association-logistic-unit.page.scss`],
})
export class ReceiptAssociationLogisticUnitPage implements ViewWillEnter {
    public readonly scannerMode = BarcodeScannerModeEnum.ONLY_SCAN;

    public packListHeader: HeaderConfig;
    public packListBody: Array<ListPanelItemConfig>;
    public listBoldValues: Array<string> = [`logisticUnit`];
    public logisticUnits: Array<string>;

    public readonly scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.WITH_MANUAL;

    private receptionNumber: string;

    @ViewChild(`footerScannerComponent`, {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public constructor(private toastService: ToastService,
                       private loadingService: LoadingService,
                       private networkService: NetworkService,
                       private navService: NavService,
                       private apiService: ApiService) {
    }

    public ionViewWillEnter(): void {
        this.receptionNumber = this.navService.param(`receptionNumber`);
        this.logisticUnits = [];
        this.updatePanelHeader();
        this.updatePackList();
    }

    private updatePanelHeader() {
        this.packListHeader = {
            leftIcon: {name: `receipt-association.svg`},
            title: `N° de réception administrative`,
            subtitle: this.receptionNumber,
            info: `${this.logisticUnits.length} unité(s) logistique(s) scannée(s)`,
            rightIcon: {
                name: `check.svg`,
                color: `success`,
                action: () => this.validate(),
            }
        };
    }

    public updatePackList() {
        this.packListBody = this.logisticUnits.map((logisticUnit: string): ListPanelItemConfig => ({
            infos: {
                logisticUnit: {
                    label: `Unité logistique`,
                    value: logisticUnit
                }
            },
            rightIcon: {
                color: `danger`,
                name: `trash.svg`,
                action: () => {
                    const packIndex = this.logisticUnits.indexOf(logisticUnit);
                    if (packIndex > -1) {
                        this.logisticUnits.splice(packIndex, 1);
                        this.updatePanelHeader();
                        this.updatePackList();
                        this.toastService.presentToast(`L'unité logistique a bien été supprimée.`);
                    }
                }
            }
        }));
    }

    public async checkExistingPack(barcode: string) {
        const hasNetwork = await this.networkService.hasNetwork();
        if (!hasNetwork) {
            this.toastService.presentToast(NetworkService.DEFAULT_HAS_NETWORK_MESSAGE)
            return;
        }

        this.loadingService
            .presentLoadingWhile({
                event: () => this.apiService.requestApi(ApiService.GET_PACK_DATA, {
                    params: {
                        code: barcode,
                        existing: 1
                    }
                })
            })
            .subscribe(({existing}) => {
                if (existing) {
                    if (this.logisticUnits.indexOf(barcode) === -1) {
                        this.logisticUnits.push(barcode);
                        this.updatePanelHeader();
                        this.updatePackList();
                    } else {
                        this.toastService.presentToast(`Cette unité logistique a déjà été ajoutée à l'association.`);
                    }
                } else {
                    this.toastService.presentToast(`L'unité logistique renseignée n'existe pas.`);
                }
            });
    }


    public validate(): void {
        if (this.logisticUnits.length === 0) {
            this.toastService.presentToast(`Merci de renseigner au moins une unité logistique avant de valider.`);
        } else {
            this.loadingService
                .presentLoadingWhile({
                    event: () => this.apiService.requestApi(ApiService.POST_RECEIPT_ASSOCIATION, {
                        params: {
                            receptionNumber: this.receptionNumber,
                            logisticUnits: this.logisticUnits
                        }
                    })
                })
                .subscribe(
                    ({success, message}) => {
                        if (message) {
                            this.toastService.presentToast(message);
                        }

                        if (success) {
                            this.navService.pop();
                        }
                    }
                );
        }
    }
}
