import {Component, ViewChild} from '@angular/core';
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {ApiService} from "@app/services/api.service";
import {ToastService} from "@app/services/toast.service";
import {NavService} from "@app/services/nav/nav.service";
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {BarcodeScannerComponent} from "@common/components/barcode-scanner/barcode-scanner.component";
import {LoadingService} from '@app/services/loading.service';
import {Subscription} from 'rxjs';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";

@Component({
    selector: 'wii-group-scan-group',
    templateUrl: './group-scan-group.page.html',
    styleUrls: ['./group-scan-group.page.scss'],
})
export class GroupScanGroupPage implements ViewWillEnter, ViewWillLeave {

    public readonly scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.WITH_MANUAL;

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    private loadingSubscription?: Subscription;

    public constructor(private apiService: ApiService,
                       private loadingService: LoadingService,
                       private toastService: ToastService,
                       private navService: NavService) {
    }

    public ionViewWillEnter(): void {
        if (this.footerScannerComponent) {
            this.footerScannerComponent.fireZebraScan();
        }
    }

    public ionViewWillLeave(): void {
        this.unsubscribeLoading();
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    public onGroupScan(code: string): void {
        if (!this.loadingSubscription) {
            const options = {
                params: {code}
            };

            this.loadingSubscription = this.loadingService
                .presentLoadingWhile({event: () => this.apiService.requestApi(ApiService.PACKS_GROUPS, options)})
                .subscribe({
                    next: (response) => {
                        this.unsubscribeLoading();
                        if (response.isPack) {
                            this.toastService.presentToast(`Le colis ${code} n'est pas un groupe`);
                        } else {
                            let group = response.packGroup || {
                                code,
                                natureId: null,
                                packs: [],
                            };

                            this.navService.push(NavPathEnum.GROUP_CONTENT, {group});
                        }
                    },
                    error: () => {
                        this.unsubscribeLoading();
                    }
                });
        }
    }

    private unsubscribeLoading() {
        if (this.loadingSubscription) {
            this.loadingSubscription.unsubscribe();
            this.loadingSubscription = undefined;
        }
    }

}
