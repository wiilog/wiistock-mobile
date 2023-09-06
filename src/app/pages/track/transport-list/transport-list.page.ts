import {Component, ViewChild} from '@angular/core';
import {ViewWillEnter} from '@ionic/angular';
import {NavService} from '@app/services/nav/nav.service';
import {TransportRound} from '@entities/transport-round';
import {FormPanelComponent} from '@common/components/panel/form-panel/form-panel.component';
import {HeaderConfig} from '@common/components/panel/model/header-config';
import {FormatService} from '@app/services/format.service';
import {MapLocation} from '@common/components/leaflet-map/leaflet-map.component';
import {TransportCardMode} from '@common/components/transport-card/transport-card.component';
import {TransportRoundLine} from '@entities/transport-round-line';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {AlertService} from '@app/services/alert.service';
import {TransportService} from '@app/services/transport.service';
import {TranslationService} from "@app/services/translations.service";

@Component({
    selector: 'wii-transport-list',
    templateUrl: './transport-list.page.html',
    styleUrls: ['./transport-list.page.scss'],
})
export class TransportListPage implements ViewWillEnter {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public headerConfig: HeaderConfig;

    public mode: TransportCardMode;

    public round: TransportRound;

    public markers: Array<MapLocation> = [];

    public mapVisible: boolean = false;

    private warningShown: boolean = false;

    public constructor(private navService: NavService,
                       private alertService: AlertService,
                       private transportService: TransportService,
                       private formatService: FormatService) {
    }

    public ionViewWillEnter(): void {
        this.mode = this.navService.param('mode');
        this.round = this.navService.param('round');

        const cancelledTransport = this.navService.param('cancelledTransport');
        if(cancelledTransport && !this.warningShown) {
            this.warningShown = true;

            this.alertService.show({
                header: `Attention`,
                cssClass: AlertService.CSS_CLASS_MANAGED_ALERT,
                message: `Le prochain point de passage a été annulé. Veuillez ne pas vous y rendre. ` +
                    `Pensez à retourner les colis à la fin de la tournée s'il s'agit d'une livraison.`,
                buttons: [{
                    text: 'OK',
                    cssClass: 'alert-success',
                }]
            });
        }

        for(const transport of this.round.lines) {
            if(this.mode === TransportCardMode.STARTABLE
                && !transport.cancelled
                && transport.success
                && transport.collect
                && !(transport.collect.success || transport.collect.failure)) {
                this.navService.push(NavPathEnum.TRANSPORT_SHOW, {
                    transport: transport.collect,
                    round: this.round,
                    mode: TransportCardMode.STARTABLE,
                });

                break;
            }
        }

        this.headerConfig = {
            title: `T${this.round.number}`,
            subtitle: [this.formatService.formatDate(this.round.date)],
            leftIcon: {
                name: 'track.svg'
            },
            ...(this.round.status === 'En cours' ? {
                rightBadge: {
                    label: `Tournée en cours`,
                    color: {
                        background: `#C4C7D5`,
                        font: `#030f4c`,
                    },
                    inline: true
                }
            } : {})
        };

        this.refreshMarkers();
    }

    public showTransport(transport: TransportRoundLine) {
        if(transport.cancelled) {
            return;
        }

        if(this.mode === TransportCardMode.STARTABLE && (transport.success || transport.failure)) {
            if(transport.success) {
                this.navService.push(NavPathEnum.FINISH_TRANSPORT, {
                    transport,
                    round: this.round,
                    edit: true,
                });
            } else {
                this.navService.push(NavPathEnum.TRANSPORT_FAILURE, {
                    transport: transport,
                    round: this.round,
                    edit: true,
                });
            }
        } else {
            if(this.mode === TransportCardMode.STARTABLE && transport.collect && transport.success && (!transport.collect.success || !transport.collect.failure)) {
                this.navService.push(NavPathEnum.TRANSPORT_SHOW, {
                    transport: transport.collect,
                    round: this.round,
                    mode: this.mode,
                });
            } else {
                this.navService.push(NavPathEnum.TRANSPORT_SHOW, {
                    transport,
                    round: this.round,
                    mode: this.mode,
                });
            }
        }
    }

    public toggleMap() {
        this.mapVisible = !this.mapVisible;
    }

    public refreshMarkers(): void {
        for (const line of this.round.lines) {
            this.markers.push({
                title: `${line.priority}. ${line.contact.name}`,
                latitude: Number(line.contact.latitude),
                longitude: Number(line.contact.longitude),
            });
        }
    }
}
