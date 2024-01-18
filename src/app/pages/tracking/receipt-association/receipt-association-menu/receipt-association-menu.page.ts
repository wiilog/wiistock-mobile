import {Component, ViewChild} from '@angular/core';
import {NavService} from '@app/services/nav/nav.service';
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {ToastService} from '@app/services/toast.service';
import {BarcodeScannerComponent} from "@common/components/barcode-scanner/barcode-scanner.component";
import {ViewWillEnter} from "@ionic/angular";
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {IconConfig} from "@common/components/panel/model/icon-config";

@Component({
    selector: 'wii-receipt-association-menu',
    templateUrl: './receipt-association-menu.page.html',
    styleUrls: ['./receipt-association-menu.page.scss'],
})
export class ReceiptAssociationMenuPage implements ViewWillEnter{
    public readonly scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.WITH_MANUAL;

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public headerConfig: {
        leftIcon: IconConfig;
        title: string;
    };

    public constructor(private toastService: ToastService,
                       private navService: NavService) {
    }

    public ionViewWillEnter() {
        this.refreshHeaderConfig();
    }

    private refreshHeaderConfig(): void {
        this.headerConfig = {
            title: `Scanner le numéro de réception`,
            leftIcon: {
                name: `receipt-association.svg`,
            }
        };
    }

    public validate(receptionNumber: string) {
        if(receptionNumber) {
            this.navService.push(NavPathEnum.RECEIPT_ASSOCIATION_LOGISTIC_UNIT, {receptionNumber});
        } else {
            this.toastService.presentToast(`Merci de renseigner un numéro de réception.`)
        }
    }
}
