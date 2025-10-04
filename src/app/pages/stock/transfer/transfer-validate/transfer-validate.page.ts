import {Component, EventEmitter, ViewChild} from '@angular/core';
import {NavService} from '@app/services/nav/nav.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {ToastService} from '@app/services/toast.service';
import {StorageService} from '@app/services/storage/storage.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {BarcodeScannerModeEnum} from '@common/components/barcode-scanner/barcode-scanner-mode.enum';
import {IconConfig} from '@common/components/panel/model/icon-config';
import {Emplacement} from '@database/emplacement';
import {SelectItemTypeEnum} from '@common/components/select-item/select-item-type.enum';
import {SelectItemComponent} from '@common/components/select-item/select-item.component';
import {mergeMap, map, tap} from 'rxjs/operators';
import {of, Subscription} from 'rxjs';
import {LoadingService} from '@app/services/loading.service';
import {TransferOrder} from '@database/transfer-order';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {NetworkService} from '@app/services/network.service';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";


@Component({
    selector: 'wii-transfer-validate',
    templateUrl: './transfer-validate.page.html',
    styleUrls: ['./transfer-validate.page.scss'],
})
export class TransferValidatePage implements ViewWillEnter, ViewWillLeave {
    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public readonly barcodeScannerSearchMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.TOOL_SEARCH;
    public readonly selectItemType = SelectItemTypeEnum.LOCATION;

    public location: Emplacement;
    public transferOrder: TransferOrder;
    public dropOnFreeLocation: boolean;
    public skipValidation: boolean;

    public panelHeaderConfig: {
        title: string;
        subtitle?: string;
        leftIcon: IconConfig;
        transparent: boolean;
    };

    public resetEmitter$: EventEmitter<void>;
    public loader?: HTMLIonLoadingElement;

    private onValidate: () => void;

    private loadingSubscription?: Subscription;

    public constructor(private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       private networkService: NetworkService,
                       private loadingService: LoadingService,
                       private localDataManager: LocalDataManagerService,
                       private navService: NavService) {
        this.resetEmitter$ = new EventEmitter<void>();
    }

    public ionViewWillEnter(): void {
        this.transferOrder = this.navService.param('transferOrder');
        this.skipValidation = this.navService.param('skipValidation');
        this.onValidate = this.navService.param('onValidate');

        this.storageService.getRight(StorageKeyEnum.PARAMETER_DROP_ON_FREE_LOCATION).subscribe((dropOnFreeLocation: boolean) => {
            this.dropOnFreeLocation = dropOnFreeLocation;
        });

        this.resetEmitter$.emit();

        this.panelHeaderConfig = this.createPanelHeaderConfig();

        if (this.selectItemComponent) {
            this.selectItemComponent.fireZebraScan();
        }
    }

    public ionViewWillLeave(): void {
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
    }

    public selectLocation(location: Emplacement): void {
        if (this.dropOnFreeLocation || location.label === this.transferOrder.destination) {
            this.location = location;
            this.panelHeaderConfig = this.createPanelHeaderConfig();

            if(this.skipValidation) {
                this.validate();
            }
        }
        else {
            this.resetEmitter$.emit();
            this.toastService.presentToast(`La destination du transfert doit être l'emplacement ${this.transferOrder.destination}.`)
        }
    }

    public validate(): void {
        if (!this.loader) {
            if (this.location && this.location.label) {
                this.unsubscribeLoading();
                this.loadingSubscription = this.loadingService.presentLoading()
                    .pipe(
                        tap((loader) => {
                            this.loader = loader;
                        }),
                        mergeMap(() => this.sqliteService.update('transfer_order', [{
                            values: {
                                treated: 1,
                                destination: this.location.label
                            },
                            where: [`id = ${this.transferOrder.id}`]
                        }])),
                        mergeMap(() => this.networkService.hasNetwork()),
                        mergeMap((hasNetwork): any => (
                            hasNetwork
                                ? this.localDataManager.sendFinishedProcess('transfer')
                                : of({offline: true})
                        )),
                        mergeMap((res: any) => (
                            res.offline || res.success.length > 0
                                ? this.storageService.incrementCounter(StorageKeyEnum.COUNTERS_TRANSFERS_TREATED).pipe(map(() => res))
                                : of(res)
                        )),
                    )
                    .subscribe({
                        next: ({offline, success}) => {
                            this.unsubscribeLoading();
                            if (offline) {
                                this.toastService.presentToast('Transfert sauvegardé localement, nous l\'enverrons au serveur une fois la connexion internet retrouvée');
                                this.closeScreen();
                            }
                            else {
                                this.handlePreparationsSuccess(success.length);
                            }
                        },
                        error: () => {
                            this.toastService.presentToast('Erreur lors de la validation du transfert.');
                        }
                    });
            }
            else {
                this.toastService.presentToast('Veuillez sélectionner ou scanner un emplacement.');
            }
        }
        else {
            this.toastService.presentToast('Chargement en cours...');
        }
    }

    private handlePreparationsSuccess(nbPreparationsSucceed: number): void {
        if (nbPreparationsSucceed > 0) {
            this.toastService.presentToast(
                (nbPreparationsSucceed === 1
                    ? 'Votre transfert a bien été enregistré'
                    : `Votre transfert et ${nbPreparationsSucceed - 1} transfert${nbPreparationsSucceed - 1 > 1 ? 's' : ''} en attente ont bien été enregistrés`)
            );
        }
        this.closeScreen();
    }

    private closeScreen(): void {
        this.navService.pop().subscribe(() => {
            this.onValidate();
        });
    }

    private createPanelHeaderConfig(): { title: string; subtitle?: string; leftIcon: IconConfig; transparent: boolean;} {
        return {
            title: 'Emplacement sélectionné',
            subtitle: this.location && this.location.label,
            transparent: true,
            leftIcon: {
                name: 'preparation.svg'
            }
        };
    }

    private unsubscribeLoading(): void {
        if (this.loadingSubscription) {
            this.loadingSubscription.unsubscribe();
            this.loadingSubscription = undefined;
        }

        if (this.loader) {
            this.loader.dismiss();
            this.loader = undefined;
        }
    }
}
