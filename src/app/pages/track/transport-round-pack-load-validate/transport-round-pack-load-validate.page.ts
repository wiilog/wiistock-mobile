import {Component, EventEmitter, ViewChild} from '@angular/core';
import {Emplacement} from "@entities/emplacement";
import {SelectItemComponent} from "@common/components/select-item/select-item.component";
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {SelectItemTypeEnum} from "@common/components/select-item/select-item-type.enum";
import {NavService} from "@app/services/nav/nav.service";
import {SqliteService} from "@app/services/sqlite/sqlite.service";
import {AlertService} from "@app/services/alert.service";
import {Nature} from "@entities/nature";
import {AllowedNatureLocation} from "@entities/allowed-nature-location";
import {ToastService} from "@app/services/toast.service";
import {ApiService} from "@app/services/api.service";
import {LoadingService} from "@app/services/loading.service";
import {zip} from 'rxjs';
import {NetworkService} from "@app/services/network.service";
import {TransportRound} from "@entities/transport-round";
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";

@Component({
    selector: 'wii-transport-round-pack-load-validate',
    templateUrl: './transport-round-pack-load-validate.page.html',
    styleUrls: ['./transport-round-pack-load-validate.page.scss'],
})
export class TransportRoundPackLoadValidatePage implements ViewWillEnter, ViewWillLeave {

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public readonly barcodeScannerSearchMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.TOOL_SEARCH;
    public readonly selectItemType = SelectItemTypeEnum.LOCATION;

    private location: Emplacement;
    private packs: Array<{
        code: string;
        nature_id: number;
        temperature_range: string;
        nature: string;
    }>;
    private round: TransportRound;
    private everythingLoaded: boolean;
    private unpreparedDeliveries: () => void;

    public panelHeaderConfig: {
        title: string;
        subtitle?: string;
        transparent: boolean;
    };

    public resetEmitter$: EventEmitter<void>;
    public loader: HTMLIonLoadingElement;

    public constructor(private navService: NavService,
                       private sqliteService: SqliteService,
                       private alertService: AlertService,
                       private toastService: ToastService,
                       private apiService: ApiService,
                       private loadingService: LoadingService,
                       private networkService: NetworkService) {
        this.resetEmitter$ = new EventEmitter<void>();
    }

    public ionViewWillEnter(): void {
        this.packs = this.navService.param('packs');
        this.everythingLoaded = this.navService.param('everythingLoaded');
        this.round = this.navService.param('round');
        this.unpreparedDeliveries = this.navService.param('unpreparedDeliveries');
        this.resetEmitter$.emit();
        this.panelHeaderConfig = this.createPanelHeaderConfig();
    }

    public ionViewWillLeave(): void {
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
    }

    private createPanelHeaderConfig(): {title: string; subtitle?: string; transparent: boolean;} {
        return {
            title: 'Emplacement de dépose sélectionné',
            subtitle: this.location && this.location.label,
            transparent: true
        };
    }

    public selectLocation(location: Emplacement): void {
        this.sqliteService.findBy('allowed_nature_location', ['location_id = ' + location.id])
            .subscribe((allowedNatures) => {
                const allowedNatureIds = allowedNatures.map((allowedNature: AllowedNatureLocation) => allowedNature.nature_id);
                const unmatchedNatures = this.packs.filter((pack) => !allowedNatureIds.includes(pack.nature_id));

                const temperatureRanges = location.temperature_ranges
                    ? location.temperature_ranges.split(';')
                    : [];
                const unmatchedTemperatures = this.packs.filter((pack) => (
                    (temperatureRanges.length === 0 && pack.temperature_range)
                    || (pack.temperature_range && !temperatureRanges.includes(pack.temperature_range))
                ));

                if (allowedNatureIds.length !== 0 && unmatchedNatures.length > 0) {
                    let formattedUnmatchedNatures = unmatchedNatures
                        .map(({code, nature}) => `<li><strong>${code}</strong> de nature <strong>${nature}</strong></li>`)
                        .join(' ');
                    formattedUnmatchedNatures = `<ul>${formattedUnmatchedNatures}</ul>`
                    const plural = unmatchedNatures.length > 1;
                    const pluralNatures = allowedNatures.length > 1;
                    const locationLabel = location.label;
                    const joinAllowedNatureIds = allowedNatures
                        .map((nature: AllowedNatureLocation) => nature.nature_id)
                        .join(',');

                    this.sqliteService.findBy('nature', [`id IN (${joinAllowedNatureIds})`])
                        .subscribe((natures: Array<Nature>) => {
                            const joinAllowedNatureLabels = natures
                                .map((nature: Nature) => `<strong>${nature.label}</strong>`)
                                .join(', ');
                            this.alertService.show({
                                header: 'Erreur',
                                backdropDismiss: false,
                                cssClass: AlertService.CSS_CLASS_MANAGED_ALERT,
                                message: `Le${plural ? 's' : ''} colis ${formattedUnmatchedNatures} ne peu${plural ? 'vent' : 't'} pas être déposé${plural ? 's' : ''} sur l'emplacement <strong>${locationLabel}</strong> de nature${pluralNatures ? 's' : ''} ${joinAllowedNatureLabels}.`,
                                buttons: [
                                    {
                                        text: 'OK',
                                    },
                                ]
                            });
                            this.resetEmitter$.emit();
                        });
                } else if (unmatchedTemperatures.length > 0) {
                    let formattedUnmatchedTemperatures = unmatchedTemperatures
                        .map(({code}) => `<li><strong>${code}</strong></li>`)
                        .join(' ');
                    formattedUnmatchedTemperatures = `<ul>${formattedUnmatchedTemperatures}</ul>`
                    const plural = unmatchedNatures.length > 1;
                    const locationLabel = location.label;
                    this.alertService.show({
                        header: 'Erreur',
                        backdropDismiss: false,
                        cssClass: AlertService.CSS_CLASS_MANAGED_ALERT,
                        message: `Le${plural ? 's' : ''} colis ${formattedUnmatchedTemperatures} ne peu${plural ? 'vent' : 't'} pas être déposé${plural ? 's' : ''} sur l'emplacement <strong>${locationLabel}</strong> (température non adéquate).`,
                        buttons: [
                            {
                                text: 'OK'
                            },
                        ]
                    });
                    this.resetEmitter$.emit();
                } else {
                    this.location = location;
                    this.panelHeaderConfig = this.createPanelHeaderConfig();
                }
            });
    }

    public async validate() {
        const hasNetwork = await this.networkService.hasNetwork();
        if (hasNetwork) {
            if (this.location) {
                const options = {
                    params: {
                        packs: this.packs.map(({code}) => code),
                        location: this.location.id,
                        round: this.round.id
                    }
                }
                zip(
                    this.loadingService.presentLoading(),
                    this.apiService.requestApi(ApiService.LOAD_PACKS, options)
                ).subscribe(([loading, response]: [HTMLIonLoadingElement, any]) => {
                    loading.dismiss();
                    if (response && response.success) {
                        const  onValidate = this.navService.param('onValidate');
                        if(onValidate) {
                            onValidate();
                        }

                        this.navService.pop({path: NavPathEnum.TRANSPORT_ROUND_PACK_LOAD}).subscribe(() => {
                            if (this.everythingLoaded) {
                                this.navService.pop({path: NavPathEnum.TRANSPORT_ROUND_LIST}).subscribe(() => {
                                    if(this.unpreparedDeliveries) {
                                        this.unpreparedDeliveries();
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                this.toastService.presentToast('Veuillez sélectionner un emplacement');
            }
        } else {
            this.toastService.presentToast('Veuillez vous connecter à internet afin de valider le chargement des colis');
        }
    }
}
