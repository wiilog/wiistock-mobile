import {Component, EventEmitter} from '@angular/core';
import {Subscription, zip} from 'rxjs';
import {LoadingService} from '@app/services/loading.service';
import {CardListConfig} from '@common/components/card-list/card-list-config';
import {CardListColorEnum} from '@common/components/card-list/card-list-color.enum';
import {MainHeaderService} from '@app/services/main-header.service';
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {Translations} from '@entities/translation';
import {TranslationService} from '@app/services/translations.service';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";
import {ApiService} from "@app/services/api.service";

@Component({
    selector: 'wii-tracking-round-list',
    templateUrl: './tracking-round-list.page.html',
    styleUrls: ['./tracking-round-list.page.scss'],
})
export class TrackingRoundListPage implements ViewWillEnter, ViewWillLeave {
    public readonly barcodeScannerSearchMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.ONLY_SCAN;

    private loadingSubscription?: Subscription;

    public loading: boolean;

    public resetEmitter$: EventEmitter<void>;

    public trackingRoundsListConfig: Array<CardListConfig>;
    public readonly trackingRoundsListColor = CardListColorEnum.LIGHT_BLUE;
    public trackingRoundsIconName?: string = 'tracking-round.svg';

    public trackingRoundTranslations: Translations;

    public constructor(private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService,
                       private translationService: TranslationService,
                       private apiService: ApiService) {
        this.resetEmitter$ = new EventEmitter<void>();
        this.loading = true;
    }


    public ionViewWillEnter(): void {
        this.resetEmitter$.emit();
        this.loadingService.presentLoadingWhile({
            event: () => {
                return zip(
                    this.apiService.requestApi(ApiService.GET_TRACKING_ROUNDS),
                    this.translationService.get(`Demande`, `Tournée`, `Champs fixes`)
                )
            },
        }).subscribe(([trackingRounds, translations]) => {
            this.refreshTrackingRoundListConfig(trackingRounds, translations);
            this.refreshSubTitle();
            this.loading = false;
        });
    }

    public ionViewWillLeave(): void {
        this.unsubscribeLoading();
    }

    private unsubscribeLoading(): void {
        if (this.loadingSubscription) {
            this.loadingSubscription.unsubscribe();
            this.loadingSubscription = undefined;
        }
    }

    public refreshSubTitle(): void {
        const trackingRoundsLength = this.trackingRoundsListConfig.length;
        this.mainHeaderService.emitSubTitle(`${trackingRoundsLength === 0 ? 'Aucune' : trackingRoundsLength} demande${trackingRoundsLength > 1 ? 's' : ''}`)
    }

    private refreshTrackingRoundListConfig(trackingRounds: {success: boolean; data: Array<any>}, translations: Translations): void {
        this.trackingRoundTranslations = translations;
        this.trackingRoundsListConfig = trackingRounds.data
            .map((trackingRound: any) => {
                return {
                    title: {label: '', value: trackingRound.typeLabel},
                    customColor: trackingRound.typeColor,
                    content: [
                        {label: 'Numéro', value: trackingRound.number || ''},
                        {label: TranslationService.Translate(this.trackingRoundTranslations, 'Statut'), value: trackingRound.statusLabel || ''},
                        {label: 'Demandeur', value: trackingRound.requestedBy || ''},
                        {
                            label: TranslationService.Translate(this.trackingRoundTranslations, 'Date attendue'),
                            value: trackingRound.expectedAt
                        },
                        {
                            label: TranslationService.Translate(this.trackingRoundTranslations, 'Emplacement de tournée'),
                            value: trackingRound.locationLabel || ''
                        },
                        {label: TranslationService.Translate(this.trackingRoundTranslations, 'Urgence'), value: trackingRound.emergency || 'Non'}
                    ].filter((item) => item && item.value),
                    ...(trackingRound.emergency
                        ? {
                            rightIcon: {
                                name: 'exclamation-triangle.svg',
                                color: 'danger'
                            }
                        }
                        : {}),
                    action: () => {
                        // this.navService.push(NavPathEnum., {
                        //     trackingRoundId: trackingRound.id
                        // });
                    }
                };
            });
    }
}
