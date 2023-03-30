import {Component, EventEmitter, ViewChild} from '@angular/core';
import {SelectItemComponent} from '@common/components/select-item/select-item.component';
import {Emplacement} from '@entities/emplacement';
import {SelectItemTypeEnum} from '@common/components/select-item/select-item-type.enum';
import {BarcodeScannerModeEnum} from '@common/components/barcode-scanner/barcode-scanner-mode.enum';
import {IconConfig} from '@common/components/panel/model/icon-config';
import {ToastService} from '@app/services/toast.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {NavService} from '@app/services/nav/nav.service';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {StorageService} from '@app/services/storage/storage.service';
import {LoadingService} from "@app/services/loading.service";
import {NetworkService} from '@app/services/network.service';
import {ApiService} from "@app/services/api.service";
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";

@Component({
    selector: 'wii-livraison-emplacement',
    templateUrl: './manual-delivery-location.page.html',
    styleUrls: ['./manual-delivery-location.page.scss'],
})
export class ManualDeliveryLocationPage implements ViewWillEnter, ViewWillLeave {
    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public readonly selectItemType = SelectItemTypeEnum.LOCATION;

    public location: Emplacement;
    public livraison: {
        type: any,
        comment: any,
        expectedAt: any,
        project: any,
        articles: any,
    };

    public barcodeScannerSearchMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.TOOL_SEARCH;

    public panelHeaderConfig: {
        title: string;
        subtitle?: string;
        leftIcon: IconConfig;
        transparent: boolean;
    };

    public resetEmitter$: EventEmitter<void>;

    private validateIsLoading: boolean;

    public skipValidation: boolean = false;

    public constructor(private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private api: ApiService,
                       private networkService: NetworkService,
                       private localDataManager: LocalDataManagerService,
                       private loadingService: LoadingService,
                       private storageService: StorageService,
                       private navService: NavService) {
        this.validateIsLoading = false;
        this.resetEmitter$ = new EventEmitter();
    }

    public ionViewWillEnter(): void {
        this.storageService.getRight(StorageKeyEnum.PARAMETER_SKIP_VALIDATION_MANUAL_DELIVERY).subscribe((skipValidation) => {
            this.skipValidation = skipValidation;
            this.livraison = this.navService.param('livraison');

            this.resetEmitter$.emit();

            this.panelHeaderConfig = this.createPanelHeaderConfig();

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

    public selectLocation(locationToTest: Emplacement): void {
        this.location = locationToTest;
        this.panelHeaderConfig = this.createPanelHeaderConfig();
        if (this.skipValidation) {
            this.validate();
        }
    }

    public async validate() {
        const hasNetwork = await this.networkService.hasNetwork();
        if (hasNetwork) {
            if (!this.validateIsLoading) {
                if (this.location && this.location.label) {
                    this.loadingService.presentLoadingWhile(
                        {
                            message: 'Envoi de la livraison en cours...',
                            event: () => {
                                this.validateIsLoading = true;
                                return this.api
                                    .requestApi(
                                        ApiService.POST_MANUAL_DEMANDE_LIVRAISON,
                                        {params: {delivery: this.livraison, location: this.location}}
                                    )
                            }
                        }
                    ).subscribe({
                        next: ({success, nomadMessage, msg}) => {
                            if (success) {
                                this.handleLivraisonSuccess();
                            } else {
                                this.handleLivraisonError(`${nomadMessage}. ${msg}`);
                            }
                        },
                        error: (error) => {
                            this.handleLivraisonError(error);
                        }
                    });
                } else {
                    this.toastService.presentToast('Veuillez sélectionner ou scanner un emplacement.');
                }
            } else {
                this.toastService.presentToast('Chargement en cours...');
            }
        } else {
            this.toastService.presentToast('Aucun réseau');
        }
    }

    private handleLivraisonSuccess(): void {
        this.toastService.presentToast('Livraison directe enregistrée avec succès');
        this.closeScreen();
    }

    private handleLivraisonError(error: any): void {
        this.validateIsLoading = false;
        this.toastService.presentToast(error);
    }

    private closeScreen(): void {
        this.validateIsLoading = false;
        this.navService.pop({path: NavPathEnum.STOCK_MENU});
    }

    private createPanelHeaderConfig(): { title: string; subtitle?: string; leftIcon: IconConfig; transparent: boolean;} {
        return {
            title: 'Emplacement sélectionné',
            subtitle: this.location && this.location.label,
            transparent: true,
            leftIcon: {
                name: 'delivery.svg'
            }
        };
    }
}
