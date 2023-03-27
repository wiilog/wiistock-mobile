import {Component, EventEmitter, ViewChild} from '@angular/core';
import {SelectItemComponent} from '@common/components/select-item/select-item.component';
import {SelectItemTypeEnum} from '@common/components/select-item/select-item-type.enum';
import {BarcodeScannerModeEnum} from '@common/components/barcode-scanner/barcode-scanner-mode.enum';
import {ToastService} from '@app/services/toast.service';
import {NavService} from '@app/services/nav/nav.service';
import {Emplacement} from '@entities/emplacement';
import {StorageService} from '@app/services/storage/storage.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {NetworkService} from '@app/services/network.service';
import {Livraison} from "@entities/livraison";
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";

@Component({
    selector: 'wii-emplacement-scan',
    templateUrl: './emplacement-scan.page.html',
    styleUrls: ['./emplacement-scan.page.scss'],
})
export class EmplacementScanPage implements ViewWillEnter, ViewWillLeave {
    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public readonly selectItemType = SelectItemTypeEnum.LOCATION;

    public fromDepose: boolean;
    public fromStock: boolean;
    public fromEmptyRound: boolean;

    private livraisonToRedirect?: Livraison;

    public barcodeScannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.TOOL_SEARCH;

    public resetEmitter$: EventEmitter<void>;

    public loading: boolean;
    public isDemoMode: boolean;
    public customAction?: (location: any) => void;
    public finishAction?: () => void;

    public constructor(private networkService: NetworkService,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       private navService: NavService) {
        this.resetEmitter$ = new EventEmitter<void>();
        this.loading = true;
    }

    public ionViewWillEnter(): void {
        this.loading = true;
        this.livraisonToRedirect = this.navService.param('livraisonToRedirect') || null;
        this.storageService.getRight(StorageKeyEnum.DEMO_MODE).subscribe((isDemoMode) => {
            this.fromDepose = Boolean(this.navService.param('fromDepose'));
            this.fromStock = Boolean(this.navService.param('fromStock'));
            this.fromEmptyRound = Boolean(this.navService.param('fromEmptyRound'));
            this.customAction = this.navService.param('customAction');
            this.finishAction = this.navService.param('finishAction');
            this.loading = false;
            this.isDemoMode = isDemoMode;
            this.barcodeScannerMode = this.fromStock || !isDemoMode
                ? BarcodeScannerModeEnum.TOOL_SEARCH
                : BarcodeScannerModeEnum.TOOLS_FULL;

            this.resetEmitter$.emit();

            if (this.selectItemComponent) {
                this.selectItemComponent.fireZebraScan();
            }
        });
    }

    public ionViewWillLeave(): void {
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
    }

    public createEmp(): void {
        this.testNetwork(() => {
            this.navService.push(NavPathEnum.NEW_EMPLACEMENT, {
                fromDepose: this.fromDepose,
                createNewEmp: (emplacement: Emplacement) => {
                    this.selectLocation(emplacement)
                }
            });
        });
    }

    public selectLocation(emplacement: Emplacement) {
        this.testNetwork(() => {
            if (this.customAction) {
                this.navService.pop().toPromise().then((_) => {
                    if (this.customAction) {
                        this.customAction(emplacement.label)
                    }
                });
            } else {
                const nextPagePath = this.fromDepose
                    ? NavPathEnum.DEPOSE
                    : (this.fromEmptyRound
                        ? NavPathEnum.EMPTY_ROUND
                        : NavPathEnum.PRISE);
                this.navService.push(nextPagePath, {
                    emplacement,
                    articlesList: this.navService.param('articlesList'),
                    fromStockLivraison: Boolean(this.navService.param('articlesList')),
                    livraisonToRedirect: this.livraisonToRedirect,
                    fromStock: this.fromStock,
                    createTakeAndDrop: this.navService.param('createTakeAndDrop') || false,
                    finishAction: this.finishAction
                });
            }
        });
    }

    private async testNetwork(callback: () => void) {
        const hasNetwork = await this.networkService.hasNetwork();
        if (!this.fromStock || hasNetwork) {
            callback();
        }
        else {
            this.toastService.presentToast('Vous devez être connecté à internet pour valider un transfert de stock');
        }
    }
}
