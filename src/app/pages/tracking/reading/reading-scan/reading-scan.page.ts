import {Component, ViewChild} from '@angular/core';
import {NavService} from "@app/services/nav/nav.service";
import {BarcodeScannerModeEnum} from '@common/components/barcode-scanner/barcode-scanner-mode.enum';
import {ApiService} from '@app/services//api.service';
import {LoadingService} from '@app/services/loading.service';
import {ToastService} from '@app/services/toast.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {BarcodeScannerComponent} from "@common/components/barcode-scanner/barcode-scanner.component";
import {ViewWillEnter, ViewWillLeave} from '@ionic/angular';
import {IconConfig} from "@common/components/panel/model/icon-config";

@Component({
    selector: 'wii-reading-scan',
    templateUrl: './reading-scan.page.html',
    styleUrls: ['./reading-scan.page.scss'],
})
export class ReadingScanPage implements ViewWillEnter, ViewWillLeave {

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public readonly scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.WITH_MANUAL;

    public headerConfig: {
        leftIcon: IconConfig;
        title: string;
    };

    public constructor(private navService: NavService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private apiService: ApiService) {
    }

    public ionViewWillLeave(): void {
        this.footerScannerComponent.unsubscribeZebraScan();
    }

    public ionViewWillEnter(): void {
        this.footerScannerComponent.fireZebraScan();
        this.refreshHeaderConfig();
    }

    public scan(barCode: string): void {
        this.loadingService
            .presentLoadingWhile({
                event: () => this.apiService.requestApi(ApiService.GET_PACK_DATA, {
                    params: {
                        code: barCode,
                        existing: 1,
                        nature: 1,
                        pack: 1,
                        movements: 1,
                        trackingDelayData: 1,
                    }
                })
            })
            .subscribe((data) => {
                if (data.existing) {
                    if (data.isPack && data.pack) {
                        this.navService.push(NavPathEnum.READING_DETAILS, {
                            values: {
                                logisticUnit: {
                                    code: data.pack.code,
                                    nature: data.pack.nature,
                                    location: data.pack.location,
                                    date: data.pack.date,
                                    quantity: data.pack.quantity,
                                },
                                movements: data.movements,
                                references: data.references,
                                types: data.types,
                                orderNumbers: data.orderNumbers,
                                suppliers: data.suppliers,
                                creatingDispatch: data.creatingDispatch,
                                inProgressDispatch: data.inProgressDispatch,
                                creatingOperationNumber: data.creatingOperationNumber,
                                trackingDelayData: data.trackingDelayData,
                            },
                        });
                    }
                    else {
                        this.toastService.presentToast(`Impossible de procéder à la lecture de cet objet`);
                    }
                } else {
                    this.toastService.presentToast(`L'objet renseigné n'existe pas dans la base.`);
                }
            });
    }

    private refreshHeaderConfig(): void {
        this.headerConfig = {
            title: `Scanner l'unité logistique`,
            leftIcon: {
                name: `reading.svg`,
            }
        };
    }
}
