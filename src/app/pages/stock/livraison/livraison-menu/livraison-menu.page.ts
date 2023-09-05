import {Component, EventEmitter, ViewChild} from '@angular/core';
import {Livraison} from '@entities/livraison';
import {CardListConfig} from '@common/components/card-list/card-list-config';
import {CardListColorEnum} from '@common/components/card-list/card-list-color.enum';
import {NavService} from '@app/services/nav/nav.service';
import {MainHeaderService} from '@app/services/main-header.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {SelectItemComponent} from '@common/components/select-item/select-item.component';
import {SelectItemTypeEnum} from '@common/components/select-item/select-item-type.enum';
import {BarcodeScannerModeEnum} from '@common/components/barcode-scanner/barcode-scanner-mode.enum';
import {Emplacement} from '@entities/emplacement';
import {Subscription, zip} from 'rxjs';
import {LoadingService} from '@app/services/loading.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import * as moment from "moment";
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";
import {TranslationService} from "@app/services/translations.service";
import {Translations} from "@entities/translation";


@Component({
    selector: 'wii-livraison-menu',
    templateUrl: './livraison-menu.page.html',
    styleUrls: ['./livraison-menu.page.scss'],
})
export class LivraisonMenuPage implements ViewWillEnter, ViewWillLeave {
    public readonly barcodeScannerSearchMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.TOOL_SEARCH;
    public readonly selectItemType = SelectItemTypeEnum.LOCATION;

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public deliveryOrders: Array<Livraison>;

    public deliveryOrdersListConfig: Array<CardListConfig>;
    public readonly deliveryOrdersListColor = CardListColorEnum.YELLOW;
    public readonly deliveryOrdersIconName = 'delivery.svg';

    public hasLoaded: boolean;

    public resetEmitter$: EventEmitter<void>;
    public locationFilterRequestParams: Array<string>;

    public loader?: HTMLIonLoadingElement;
    public firstLaunch: boolean;

    private loadingSubscription?: Subscription;

    public deliveryOrderTranslation: string;
    public projectTranslation: string;

    public constructor(private mainHeaderService: MainHeaderService,
                       private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private navService: NavService,
                       private translationService: TranslationService) {
        this.resetEmitter$ = new EventEmitter();
        this.locationFilterRequestParams = [];
        this.firstLaunch = true;

        zip(
            this.translationService.get(null, `Ordre`, `Livraison`),
            this.translationService.get(null, `Référentiel`, `Projet`)
        ).subscribe(([deliveryOrderTranslations, projectTranslations]: [Translations, Translations]) => {
            this.deliveryOrderTranslation = TranslationService.Translate(deliveryOrderTranslations, 'Livraison');
            this.projectTranslation = TranslationService.Translate(projectTranslations, 'Projet');
        });
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;
        const withoutLoading = this.navService.param('withoutLoading');
        if (!this.firstLaunch || !withoutLoading) {
            this.resetEmitter$.emit();

            this.unsubscribeLoading();
            this.loadingSubscription = zip(
                this.loadingService.presentLoading(),
                this.sqliteService.findAll<Livraison>('livraison')
            )
                .subscribe(([loader, deliveries]: [HTMLIonLoadingElement, Array<Livraison>]) => {
                    this.loader = loader;
                    this.deliveryOrders = deliveries
                        .filter(({date_end}) => (date_end === null))
                        .sort((a, b) => {
                            const momentExpectedDate1 = moment(a.expectedAt, 'DD/MM/YYYY HH:mm:ss')
                            const momentExpectedDate2 = moment(b.expectedAt, 'DD/MM/YYYY HH:mm:ss')
                            return (
                                (momentExpectedDate1.isValid() && !momentExpectedDate2.isValid()) || momentExpectedDate1.isBefore(momentExpectedDate2) ? -1 :
                                    (!momentExpectedDate1.isValid() && momentExpectedDate2.isValid()) || momentExpectedDate1.isAfter(momentExpectedDate2) ? 1 :
                                        0
                            );
                        });
                    const preparationLocationsStr = deliveries
                        .reduce((acc: Array<string>, {preparationLocation}) => {
                            if (preparationLocation && acc.indexOf(preparationLocation) === -1) {
                                acc.push(preparationLocation);
                            }
                            return acc;

                        }, [])
                        .map((label) => `'${label.replace("'", "''")}'`);

                    this.locationFilterRequestParams = preparationLocationsStr.length > 0
                        ? [`label IN (${preparationLocationsStr.join(',')})`]
                        : [];

                    this.refreshListConfig(this.deliveryOrders);
                    this.refreshSubTitle(this.deliveryOrders);

                    this.hasLoaded = true;
                    this.unsubscribeLoading();
                });
        }
        else {
            this.hasLoaded = true;
            this.firstLaunch = false;
        }
    }

    public refreshSubTitle(deliveryOrders: Array<Livraison>): void {
        const deliveryOrdersLength = deliveryOrders.length;
        this.mainHeaderService.emitSubTitle(`${deliveryOrdersLength === 0 ? 'Aucune' : deliveryOrdersLength} ${this.deliveryOrderTranslation.toLowerCase()}${deliveryOrdersLength > 1 ? 's' : ''}`)
    }

    public ionViewWillLeave(): void {
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
    }

    public filterByLocation(location?: Emplacement) {
        const deliveryOrdersToDisplay = this.deliveryOrders.filter(({preparationLocation}) => (
            !location || (location.label === preparationLocation)
        ))
        this.refreshListConfig(deliveryOrdersToDisplay);
        this.refreshSubTitle(deliveryOrdersToDisplay);
    }

    public refreshListConfig(deliveryOrders: Array<Livraison>): void {
        this.deliveryOrdersListConfig = deliveryOrders
            .map((livraison: Livraison) => ({
                title: {
                    label: 'Demandeur',
                    value: livraison.requester
                },
                customColor: livraison.color,
                content: [
                    {
                        label: 'Numéro',
                        value: livraison.number
                    },
                    {
                        label: 'Flux',
                        value: livraison.type
                    },
                    {
                        label: 'Destination',
                        value: livraison.location
                    },
                    {
                        label: 'Commentaire',
                        value: livraison.comment
                    },
                    ...(
                        livraison.preparationLocation
                            ? [{
                                label: 'Emplacement de préparation',
                                value: livraison.preparationLocation
                            }]
                            : []
                    ),
                    ...(
                        livraison.expectedAt
                            ? [{
                                label: 'Date attendue',
                                value: livraison.expectedAt
                            }]
                            : []
                    ),
                    ...(
                        livraison.project
                            ? [{
                                label: this.projectTranslation,
                                value: livraison.project
                            }]
                            : []
                    )
                ],
                action: () => {
                    this.navService.push(NavPathEnum.LIVRAISON_ARTICLES, {livraison});
                }
            }));
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
