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
import {SqliteService} from "@app/services/sqlite/sqlite.service";
import {LoadingService} from "@app/services/loading.service";
import {AlertService} from "@app/services/alert.service";
import {mergeMap, Observable, of, Subject, tap} from "rxjs";

@Component({
    selector: 'wii-emplacement-scan',
    templateUrl: './emplacement-scan.page.html',
    styleUrls: ['./emplacement-scan.page.scss'],
})
export class EmplacementScanPage implements ViewWillEnter, ViewWillLeave {
    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public readonly selectItemType = SelectItemTypeEnum.LOCATION;

    public label: string;
    public fromDepose: boolean;
    public fromStock: boolean;
    public fromEmptyRound: boolean;
    public restrictedLocations: Array<Emplacement> = [];

    private livraisonToRedirect?: Livraison;

    public barcodeScannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.TOOL_SEARCH;

    public resetEmitter$: EventEmitter<void>;

    public loading: boolean;
    public isDemoMode: boolean;
    public customAction?: (location: Emplacement) => void;
    public finishAction?: () => void;

    public constructor(private networkService: NetworkService,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       private navService: NavService,
                       private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private alertService: AlertService) {
        this.resetEmitter$ = new EventEmitter<void>();
        this.loading = true;
    }

    public ionViewWillEnter(): void {
        this.loading = true;
        this.livraisonToRedirect = this.navService.param('livraisonToRedirect') || null;
        this.storageService.getRight(StorageKeyEnum.DEMO_MODE).subscribe((isDemoMode) => {
            this.label = this.navService.param('customLabel') ?? 'Sélectionner emplacement';
            this.fromDepose = Boolean(this.navService.param('fromDepose'));
            this.fromStock = Boolean(this.navService.param('fromStock'));
            this.fromEmptyRound = Boolean(this.navService.param('fromEmptyRound'));
            this.restrictedLocations = this.navService.param('restrictedLocations');
            this.customAction = this.navService.param('customAction');
            this.finishAction = this.navService.param('finishAction');
            this.loading = false;
            this.isDemoMode = isDemoMode;
            this.barcodeScannerMode = this.navService.param(`scanMode`) || (this.fromStock || !isDemoMode
                ? BarcodeScannerModeEnum.TOOL_SEARCH
                : BarcodeScannerModeEnum.TOOLS_FULL
            )

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

    public checkRestrictions(location: Emplacement): Observable<boolean> {
        if (location
            && this.restrictedLocations
            && this.restrictedLocations.length > 0
            && this.restrictedLocations.findIndex(({id}) => id === location.id) === -1) {

            const res$ = new Subject<boolean>();
            return this.loadingService.presentLoadingWhile({
                event: () => this.sqliteService.findBy(`emplacement`, [`id IN (${this.restrictedLocations.map(({id}) => id).join(',')})`])
            }).pipe(
                tap(() => {
                    this.selectItemComponent.unsubscribeZebraScan();
                }),
                mergeMap((locations: Array<Emplacement>) => {
                    const restrictedLocations = locations
                        .sort((l1, l2) => l1.label < l2.label ? -1 : 1)
                        .slice(0, 3)
                        .map(({label}) => `<br><strong>${label}</strong>`)
                        .join(' ');
                    return this.alertService.show({
                        message: `
                            <img src="assets/icons/round-exclamation.svg" class="medium">
                            <br>L'emplacement scanné n'est pas autorisé pour une dépose. Vous pouvez scanner ${locations.length > 1 ? `les emplacements suivants` : `l'emplacement suivant`}&nbsp;:
                            ${restrictedLocations}
                        `,
                        cssClass: AlertService.CSS_CLASS_MANAGED_ALERT,
                        backdropDismiss: false,
                        buttons: [
                            {
                                text: 'OK',
                                role: 'cancel',
                                handler: () => {
                                    this.selectItemComponent.fireZebraScan();
                                    res$.next(false);
                                },
                            },
                        ]
                    });
                }),
                mergeMap(() => res$)
            )
        }
        else {
            return of(true)
        }
    }

    public selectLocation(location: Emplacement): void {
        this.checkRestrictions(location).subscribe((noRestrictions: boolean) => {
            if(noRestrictions) {
                this.testNetwork(() => {
                    if (this.customAction) {
                        this.navService.pop().subscribe(() => {
                            if (this.customAction) {
                                this.customAction(location)
                            }
                        });
                    } else {
                        const nextPagePath = this.fromDepose
                            ? NavPathEnum.DEPOSE
                            : (this.fromEmptyRound
                                ? NavPathEnum.EMPTY_ROUND
                                : NavPathEnum.PRISE);
                        this.navService.push(nextPagePath, {
                            emplacement: location,
                            articlesList: this.navService.param('articlesList'),
                            fromStockLivraison: Boolean(this.navService.param('articlesList')),
                            livraisonToRedirect: this.livraisonToRedirect,
                            fromStock: this.fromStock,
                            createTakeAndDrop: this.navService.param('createTakeAndDrop') || false,
                            finishAction: this.finishAction || (() => {
                                this.navService.pop();
                            })
                        });
                    }
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
