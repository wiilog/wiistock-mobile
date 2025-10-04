import {Component} from '@angular/core';
import {Subscription, zip} from 'rxjs';
import {LoadingService} from '@app/services/loading.service';
import {TranslationService} from '@app/services/translations.service';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";
import {ApiService} from "@app/services/api.service";
import {NavService} from "@app/services/nav/nav.service";
import {SqliteService} from "@app/services/sqlite/sqlite.service";
import {Nature} from "@database/nature";
import {ToastService} from "@app/services/toast.service";
import {Translations} from "@database/translation";
import {Pack} from "@api/pack";
import {HeaderConfig} from "@common/components/panel/model/header-config";
import {ListPanelItemConfig} from "@common/components/panel/model/list-panel/list-panel-item-config";

@Component({
    selector: 'wii-tracking-round-ongoing-packs',
    templateUrl: './tracking-round-ongoing-packs.page.html',
    styleUrls: ['./tracking-round-ongoing-packs.page.scss'],
})
export class TrackingRoundOngoingPacksPage implements ViewWillEnter, ViewWillLeave {

    private loadingSubscription?: Subscription;

    public ongoingPacks: Array<Pack>;

    public headerConfig: HeaderConfig;
    public bodyConfig: Array<ListPanelItemConfig>;

    public translations: {
        trackingRoundGeneral: Translations,
        trackingRoundFixedFields: Translations,
    };

    private natureIdsToConfig: {
        [id: number]: {
            label: string,
            color: string,
        },
    } = {};

    public readonly listBoldValues: Array<string> = [
        'logisticUnits',
        'quantity',
        'nature',
    ];

    private trackingRoundId: number;

    public constructor(private loadingService: LoadingService,
                       private sqliteService: SqliteService,
                       private translationService: TranslationService,
                       private navService: NavService,
                       private toastService: ToastService,
                       private apiService: ApiService) {
    }


    public ionViewWillEnter(): void {
        this.unsubscribeLoading();

        this.trackingRoundId = this.navService.param('trackingRoundId');

        if (!this.trackingRoundId) {
            this.navService.pop();
        }

        this.loadingSubscription = this.loadingService.presentLoadingWhile({
            event: () => {
                return zip(
                    this.apiService.requestApi(ApiService.GET_TRACKING_ROUND_ONGOING_PACKS, {
                        pathParams: {
                            trackingRound: this.trackingRoundId
                        }
                    }),
                    this.sqliteService.findAll('nature'),
                    this.translationService.get(`Demande`, `Tournée`, `Général`),
                    this.translationService.get(`Demande`, `Tournée`, `Champs fixes`),
                )
            },
        }).subscribe(([result, natures, trackingRoundGeneralTranslations, trackingRoundFixedFieldsTranslations]) => {
            this.ongoingPacks = result.data || [];
            this.translations = {
                trackingRoundGeneral: trackingRoundGeneralTranslations,
                trackingRoundFixedFields: trackingRoundFixedFieldsTranslations,
            };

            if (this.ongoingPacks.length === 0) {
                this.navService.pop();
                this.toastService.presentToast(TranslationService.Translate(this.translations.trackingRoundGeneral, `Vous n'avez pas d'unité logistique en cours pour cette tournée`));
                return;
            }

            this.natureIdsToConfig = natures.reduce((acc, {id, color, label}: Nature) => ({
                [id]: {label, color},
                ...acc
            }), {});

            this.refreshHeaderConfig();
            this.refreshBodyConfig();
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

    private refreshHeaderConfig() {
        const ongoingPacksNumber = this.ongoingPacks.length > 99 ? '+99' : this.ongoingPacks.length;
        const labelCounter = typeof ongoingPacksNumber === 'string' || ongoingPacksNumber > 1
            ? TranslationService.Translate(this.translations.trackingRoundGeneral, 'Unités logistiques')
            : TranslationService.Translate(this.translations.trackingRoundGeneral, 'Unité logistique') ;
        this.headerConfig = {
            title: TranslationService.Translate(this.translations.trackingRoundGeneral, 'Unités logistiques en prise'),
            info: `${ongoingPacksNumber} ${labelCounter}`,
            leftIcon: {
                name: 'upload.svg',
                color: 'primary'
            },
        };
    }

    private refreshBodyConfig(): void {
        this.bodyConfig = this.ongoingPacks.map(({code, quantity, natureId}): ListPanelItemConfig => {

            const natureConfig = natureId
                ? this.natureIdsToConfig[natureId]
                : undefined;

            return {
                color: natureConfig?.color,
                infos: {
                    logisticUnit: {
                        label: TranslationService.Translate(this.translations.trackingRoundGeneral, 'Unité logistique'),
                        value: code,
                    },
                    quantity: {
                        label: TranslationService.Translate(this.translations.trackingRoundFixedFields, 'Quantité'),
                        value: `${quantity}`,
                    },
                    ...(natureConfig?.label
                        ? {
                            nature: {
                                label: TranslationService.Translate(this.translations.trackingRoundGeneral, 'Nature'),
                                value: natureConfig.label
                            }
                        }
                        : {}),
                }
            };
        });
    }

}
