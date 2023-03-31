import {Component, EventEmitter, ViewChild} from '@angular/core';
import {NavService} from "@app/services/nav/nav.service";
import {TransportRound} from "@entities/transport-round";
import {ToastService} from "@app/services/toast.service";
import {BarcodeScannerComponent} from "@common/components/barcode-scanner/barcode-scanner.component";
import {SqliteService} from "@app/services/sqlite/sqlite.service";
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {Emplacement} from "@entities/emplacement";
import {AllowedNatureLocation} from "@entities/allowed-nature-location";
import {Nature} from "@entities/nature";
import {AlertService} from "@app/services/alert.service";
import {SelectItemTypeEnum} from "@common/components/select-item/select-item-type.enum";
import {SelectItemComponent} from "@common/components/select-item/select-item.component";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";

@Component({
    selector: 'wii-transport-round-finish-pack-drop',
    templateUrl: './transport-round-finish-pack-drop-validate.page.html',
    styleUrls: ['./transport-round-finish-pack-drop-validate.page.scss'],
})
export class TransportRoundFinishPackDropValidatePage implements ViewWillEnter, ViewWillLeave {

    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.TOOL_SEARCH;
    public readonly selectItemType = SelectItemTypeEnum.LOCATION;

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    private round: TransportRound;
    private location: Emplacement;
    private packs: Array<{
        code: string;
        dropped: boolean;
        nature_id: number;
        temperature_range: string;
        nature: string;
    }>;
    private undeliveredPacksLocations: Array<number>;
    private endRoundLocations: Array<number>;
    private hasPacksToDrop: boolean;

    public panelHeaderConfig: {
        title: string;
        subtitle?: string;
        transparent: boolean;
    };

    public resetEmitter$: EventEmitter<void>;

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public constructor(private navService: NavService,
                       private toastService: ToastService,
                       private sqliteService: SqliteService,
                       private alertService: AlertService) {
        this.resetEmitter$ = new EventEmitter<void>();
    }

    public ionViewWillEnter(): void {
        this.round = this.navService.param('round');
        this.packs = this.navService.param('packs');
        this.undeliveredPacksLocations = this.navService.param('undeliveredPacksLocations');
        this.endRoundLocations = this.navService.param('endRoundLocations');
        this.hasPacksToDrop = this.navService.param('hasPacksToDrop');

        this.resetEmitter$.emit();
        this.panelHeaderConfig = this.createPanelHeaderConfig();
    }

    public ionViewWillLeave(): void {
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    public validate(): void {
        if(this.location) {
            const packsToDrop = this.packs.filter(({dropped}) => !dropped);
            if (packsToDrop.length === 0) {
                this.navService.push(NavPathEnum.TRANSPORT_ROUND_FINISH, {
                    packsDropLocation: this.location,
                    endRoundLocations: this.endRoundLocations,
                    packs: this.packs,
                    round: this.round,
                    hasPacksToDrop: this.hasPacksToDrop
                });
            } else {
                this.toastService.presentToast('Tous les colis doivent être déposés pour terminer la tournée');
            }
        } else {
            this.toastService.presentToast(`Veuillez scanner un emplacement valide`)
        }
    }

    private createPanelHeaderConfig(): { title: string; subtitle?: string; transparent: boolean; } {
        return {
            title: 'Emplacement de dépose sélectionné',
            subtitle: this.location && this.location.label,
            transparent: true
        };
    }

    public selectLocation(location: Emplacement): void {
        if (this.undeliveredPacksLocations.includes(location.id)) {
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
                            .map(({
                                      code,
                                      nature
                                  }) => `<li><strong>${code}</strong> de nature <strong>${nature}</strong></li>`)
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
        } else {
            this.toastService.presentToast(`Erreur : L'emplacement sélectionné ne fait pas partie des emplacements de retour des colis non livrés`);
        }
    }
}
