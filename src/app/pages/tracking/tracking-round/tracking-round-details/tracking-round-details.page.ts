import {Component, EventEmitter, ViewChild} from '@angular/core';
import {Subscription, zip} from 'rxjs';
import {NavService} from '@app/services/nav/nav.service';
import {LoadingService} from '@app/services/loading.service';
import {CardListColorEnum} from '@common/components/card-list/card-list-color.enum';
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {Translations} from '@database/translation';
import {TranslationService} from '@app/services/translations.service';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";
import {ApiService} from "@app/services/api.service";
import {BarcodeScannerComponent} from "@common/components/barcode-scanner/barcode-scanner.component";
import {HeaderConfig} from "@common/components/panel/model/header-config";
import {PanelHeaderComponent} from "@common/components/panel/panel-header/panel-header.component";
import {TrackingRound} from "@api/tracking-round";
import * as moment from 'moment';
import {TimelineConfig} from "@common/components/timeline/timeline-config";
import {TrackingRoundLine} from "@api/tracking-round-line";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";

@Component({
    selector: 'wii-tracking-round-list',
    templateUrl: './tracking-round-details.page.html',
    styleUrls: ['./tracking-round-details.page.scss'],
})
export class TrackingRoundDetailsPage implements ViewWillEnter, ViewWillLeave {
    public readonly barcodeScannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.ONLY_SCAN;

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    @ViewChild('formHeaderComponent', {static: false})
    public formHeaderComponent: PanelHeaderComponent;

    private loadingSubscription?: Subscription;

    public loading: boolean;
    public fabListActivated: boolean;
    public isStarted: boolean;

    public resetEmitter$: EventEmitter<void>;

    public trackingRoundHeaderConfig: HeaderConfig;

    public trackingRoundsListConfig: TimelineConfig;

    public trackingRoundTranslations: Translations;

    public messageLoading?: string;

    public trackingRoundId: number;

    public trackingRoundToDoStatusCode: string = "A faire";
    public trackingRoundPauseStatusCode: string = "Pause";

    public constructor(private loadingService: LoadingService,
                       private translationService: TranslationService,
                       private apiService: ApiService,
                       private navService: NavService) {
        this.resetEmitter$ = new EventEmitter<void>();
        this.loading = true;
        this.fabListActivated = false
        this.messageLoading = "Récupération de la tournée en cours...";
    }


    public ionViewWillEnter(): void {
        this.loading = true;
        this.resetEmitter$.emit();
        this.trackingRoundId = this.navService.param('trackingRoundId');
        this.loadingService.presentLoadingWhile({
            event: () => {
                return zip(
                    this.apiService.requestApi(ApiService.GET_TRACKING_ROUND_DETAILS, {
                        pathParams: {
                            trackingRound: this.trackingRoundId,
                        }
                    }),
                    this.translationService.get(`Demande`, `Tournée`, `Champs fixes`)
                )
            },
        }).subscribe(([trackingRound, translations]) => {
            this.refreshTrackingRoundHeaderConfig(trackingRound.data, translations, false);
            this.loading = false;
        });
    }

    public ionViewWillLeave(): void {
        this.unsubscribeLoading();
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    private unsubscribeLoading(): void {
        if (this.loadingSubscription) {
            this.loadingSubscription.unsubscribe();
            this.loadingSubscription = undefined;
        }
    }

    private refreshTrackingRoundHeaderConfig(trackingRound: TrackingRound, translations: Translations, opened: boolean): void {
        this.trackingRoundTranslations = translations;
        this.isStarted = trackingRound.isStarted;

        this.trackingRoundsListConfig = {
            title: "emplacement",
            disableList: [this.trackingRoundToDoStatusCode, this.trackingRoundPauseStatusCode].includes(trackingRound.statusLabel),
            elements: trackingRound.lines.map((line: TrackingRoundLine) => ({
                name: line.locationLabel,
                checked: line.checked,
                clickable: line.clickable,
                action: () => {
                    if(line.clickable) {
                        this.navService.push(NavPathEnum.TRACKING_ROUND_MOVEMENT, {
                            trackingRound: trackingRound,
                            trackingRoundLine: line,
                        });
                    }
                },
                // rightBadge: {
                //     label: '', //rajouter le nombre d'anomalies //TODO WIIS-13105
                //     icon: 'emergency.svg',
                //     inline: true
                // },
            })),
            commonIcon: {
                name: 'location-black.svg'
            },
        };

        this.trackingRoundHeaderConfig = {
            title: `${trackingRound.typeLabel}`,
            subtitle: [
                TranslationService.Translate(this.trackingRoundTranslations, 'Date attendue') + ` : ${moment(trackingRound.expectedAt).format('DD/MM/YYYY HH:mm') || ''}`,
                TranslationService.Translate(this.trackingRoundTranslations, 'Statut') + ` : ${trackingRound.statusLabel || ''}`,
                TranslationService.Translate(this.trackingRoundTranslations, 'Emplacement de la tournée') + ` : ${trackingRound.locationLabel || ''}`,
                TranslationService.Translate(this.trackingRoundTranslations, 'Urgence') + ` : ${trackingRound.emergency || 'Non'}`,
            ].filter((item) => item),
            info: trackingRound.number,
            transparent: true,
            collapsed: true,
            onToggle: (opened) => {
                this.refreshTrackingRoundHeaderConfig(trackingRound, this.trackingRoundTranslations, opened);
            },
            leftIcon: {
                color: CardListColorEnum.LIGHT_BLUE,
                customColor: trackingRound.typeColor,
                name: 'tracking-round.svg'
            },
            rightIcon: {
                name: opened ? 'double-arrow-up.svg' : 'double-arrow-down.svg',
                color: 'dark',
                width: '26px',
                action: () => {
                    this.formHeaderComponent.toggleTitle();
                }
            },
        };
    }

    public onMenuClick(): void {
        this.fabListActivated = !this.fabListActivated;
    }
    public startTrackingRound(): void {
        this.loadingService.presentLoadingWhile({
            event: () =>
                this.apiService.requestApi(ApiService.START_TRACKING_ROUND, {
                    pathParams: {
                        trackingRound: this.trackingRoundId,
                }
            }),
        }).subscribe(({data}) => {
            this.refreshTrackingRoundHeaderConfig(data, this.trackingRoundTranslations, false);
            this.formHeaderComponent.toggleTitle();
        })
    }
    public onPauseClick(): void {}

    public onShowOngoingPacksClick(): void {
        this.navService.push(NavPathEnum.TRACKING_ROUND_ONGOING_PACKS, {
            trackingRoundId: this.trackingRoundId,
        });
    }

    public onAddLocationClick(): void {}

    public testIfBarcodeEquals(locationScanned: string): void {

    }
}
