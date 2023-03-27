import {Component, ViewChild} from '@angular/core';
import {SelectItemTypeEnum} from "@common/components/select-item/select-item-type.enum";
import {Emplacement} from "@entities/emplacement";
import {ToastService} from "@app/services/toast.service";
import {StorageService} from "@app/services/storage/storage.service";
import {NavService} from "@app/services/nav/nav.service";
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {SelectItemComponent} from "@common/components/select-item/select-item.component";
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";
import {NetworkService} from '@app/services/network.service';

@Component({
    selector: 'wii-ungroup-scan-location',
    templateUrl: './ungroup-scan-location.page.html',
    styleUrls: ['./ungroup-scan-location.page.scss'],
})
export class UngroupScanLocationPage implements ViewWillEnter, ViewWillLeave {

    public readonly selectItemType = SelectItemTypeEnum.LOCATION;
    public readonly barcodeScannerMode = BarcodeScannerModeEnum.TOOL_SEARCH;

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public constructor(private networkService: NetworkService,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       private navService: NavService) {
    }


    public ionViewWillEnter(): void {
        if (this.selectItemComponent) {
            this.selectItemComponent.fireZebraScan();
        }
    }

    public ionViewWillLeave(): void {
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
    }

    public selectLocation(location: Emplacement) {
        this.testNetwork(() => {
            this.navService.push(NavPathEnum.UNGROUP_SCAN_GROUP, {
                location,
                finishAction: () => {
                    this.navService.pop();
                }
            });
        });
    }

    private async testNetwork(callback: () => void) {
        const hasNetwork = await this.networkService.hasNetwork();
        if (hasNetwork) {
            callback();
        } else {
            this.toastService.presentToast('Vous devez être connecté à internet pour valider un dégroupage');
        }
    }

}
