import {Component, ViewChild} from '@angular/core';
import {NavService} from "@app/services/nav/nav.service";
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {BarcodeScannerComponent} from "@common/components/barcode-scanner/barcode-scanner.component";
import {Emplacement} from "@database/emplacement";
import {ToastService} from "@app/services/toast.service";
import {SqliteService} from "@app/services/sqlite/sqlite.service";
import {LoadingService} from "@app/services/loading.service";
import {ApiService} from "@app/services/api.service";
import {TransportRound} from "@database/transport-round";
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";

@Component({
	selector: 'wii-transport-round-finish',
	templateUrl: './transport-round-finish.page.html',
	styleUrls: ['./transport-round-finish.page.scss'],
})

export class TransportRoundFinishPage implements ViewWillEnter, ViewWillLeave {

    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.ONLY_SCAN;

    private endRoundLocations: Array<number>;
    private round: TransportRound;
    private packsDropLocation: Emplacement;
    private hasPacksToDrop: boolean;
    private packs: Array<{
        code: string;
        dropped: boolean;
        nature_id: number;
        temperature_range: string;
    }>;

    public panelHeaderConfig: {
        title: string;
        transparent: boolean;
    };

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private toastService: ToastService,
                       private apiService: ApiService,
                       private navService: NavService) {
    }

    public ionViewWillEnter() {
        this.endRoundLocations = this.navService.param('endRoundLocations');
        this.hasPacksToDrop = this.navService.param('hasPacksToDrop');
        this.packsDropLocation = this.navService.param('packsDropLocation');
        this.packs = this.navService.param('packs');
        this.round = this.navService.param('round');
        this.panelHeaderConfig = {
            title: `Flasher l'emplacement de fin de tournée`,
            transparent: true,
        };
    }

    public ionViewWillLeave(): void {
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    public selectLocation(locationLabel: string): void {
        this.loadingService.presentLoadingWhile({
            event: () => this.sqliteService.findOneBy(`emplacement`, {label: locationLabel})
        }).subscribe((location: Emplacement|null) => {
            if(location && this.endRoundLocations.includes(location.id)) {
                const options = {
                    params: {
                        round: this.round.id,
                        location: location.id,
                        ...this.packs && this.packsDropLocation
                            ? {
                                packs: this.packs.map(({code}) => code),
                                packsDropLocation: this.packsDropLocation.id
                            }
                            : {},
                    }
                };
                this.loadingService.presentLoadingWhile({
                    message: `Finalisation de la tournée`,
                    event: () => this.apiService.requestApi(ApiService.FINISH_ROUND, options)
                }).subscribe(({success}) => {
                    if(success) {
                        this.toastService.presentToast(`La tournée a bien été finalisée.`)
                        this.navService.pop({path: NavPathEnum.TRANSPORT_ROUND_LIST});
                    } else {
                        this.toastService.presentToast('Une erreur est survenue')
                    }
                });
            }
            else {
                this.toastService.presentToast(`L'emplacement scanné ne fait pas partie des emplacements de fin de tournée.`)
            }
        });
    }
}
