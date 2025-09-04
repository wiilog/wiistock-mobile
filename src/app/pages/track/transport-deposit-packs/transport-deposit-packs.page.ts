import {Component, ViewChild} from '@angular/core';
import {NavService} from "@app/services/nav/nav.service";
import {TransportRound} from "@entities/transport-round";
import {TranslationService} from "@app/services/translations.service";
import {IconColor} from "@common/components/icon/icon-color";
import {CardListColorEnum} from "@common/components/card-list/card-list-color.enum";
import {TransportRoundLine} from "@entities/transport-round-line";
import {HeaderConfig} from "@common/components/panel/model/header-config";
import {ListPanelItemConfig} from "@common/components/panel/model/list-panel/list-panel-item-config";
import {ToastService} from "@app/services/toast.service";
import {BarcodeScannerComponent} from "@common/components/barcode-scanner/barcode-scanner.component";
import {Translations} from "@entities/translation";
import {SqliteService} from "@app/services/sqlite/sqlite.service";
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";
import {AlertService} from "@app/services/alert.service";
import {ApiService} from "@app/services/api.service";
import {zip} from 'rxjs';
import {LoadingService} from "@app/services/loading.service";
import {NetworkService} from '@app/services/network.service';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";

@Component({
    selector: 'wii-transport-deposit-packs',
    templateUrl: './transport-deposit-packs.page.html',
    styleUrls: ['./transport-deposit-packs.page.scss'],
})
export class TransportDepositPacksPage implements ViewWillEnter, ViewWillLeave {

    public readonly listBoldValues = ['code', 'nature', 'temperature_range'];
    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.INVISIBLE;

    private natureTranslations: Translations;
    private round: TransportRound;
    private packs: Array<{
        code: string;
        nature: string;
        nature_id: number;
        returning: boolean;
        returned: boolean;
        rejected: boolean;
    }>;
    private undeliveredPacksLocations: Array<number>;

    public packsToReturnListConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };

    public packsReturnedListConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };

    private natureIdsToColors: {[natureId: number]: string};

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public constructor(private navService: NavService,
                       private toastService: ToastService,
                       private sqliteService: SqliteService,
                       private translationService: TranslationService,
                       private alertService: AlertService,
                       private apiService: ApiService,
                       private loadingService: LoadingService) {
        this.natureIdsToColors = {};
    }

    public ionViewWillEnter(): void {
        this.round = this.navService.param('round');
        this.undeliveredPacksLocations = this.navService.param('undeliveredPacksLocations');
        this.packs = this.round.lines
            .filter((line) => line.failure || line.cancelled)
            .reduce((acc: Array<any>, line: TransportRoundLine) => [...(line.packs || []), ...acc], [])
            .filter(({returned, rejected}) => !returned && !rejected);

        zip(
            this.loadingService.presentLoading('Récupération des données en cours'),
            this.translationService.get(null, `Traçabilité`, `Général`)
        )
            .subscribe(([loading, natureTranslations]: [HTMLIonLoadingElement, Translations]) => {
                this.natureTranslations = natureTranslations;
                loading.dismiss();

                this.refreshListReturnedConfig();
                this.refreshListToReturnConfig();
            });
    }

    public ionViewWillLeave(): void {
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    private refreshListToReturnConfig(): void {
        const packsToReturn = this.packs.filter(({returning, returned}) => (!returning && !returned));
        const natureTranslation = TranslationService.Translate(this.natureTranslations, 'Nature')
        const natureTranslationCapitalized = natureTranslation.charAt(0).toUpperCase() + natureTranslation.slice(1);

        const hasPackToReturn = this.packs && this.packs.some(({returning, returned}) => !returning && !returned);
        this.packsToReturnListConfig = {
            header: {
                title: 'Colis à déposer',
                info: `${packsToReturn.length} colis`,
                leftIcon: {
                    name: 'packs-to-load.svg',
                    color: CardListColorEnum.PURPLE,
                },
                rightIconLayout: 'horizontal',
                ...(hasPackToReturn
                    ? {
                        rightIcon: [
                            {
                                color: 'primary',
                                name: 'scan-photo.svg',
                                action: () => {
                                    this.footerScannerComponent.scan();
                                }
                            },
                            {
                                name: 'up.svg',
                                action: () => this.returnAll()
                            }
                        ]
                    }
                    : {})
            },
            body: packsToReturn.map((pack) => ({
                ...(TransportDepositPacksPage.packToListItemConfig(pack, natureTranslationCapitalized)),
                rightIcon: {
                    color: 'grey' as IconColor,
                    name: 'up.svg',
                    action: () => this.returnPack(pack.code)
                },
            }))
        };
    }

    private refreshListReturnedConfig(): void {
        const returnedPacks = this.packs.filter(({returning, returned}) => returning && !returned);
        const natureTranslation = TranslationService.Translate(this.natureTranslations, 'Nature')
        const natureTranslationCapitalized = natureTranslation.charAt(0).toUpperCase() + natureTranslation.slice(1);

        const plural = returnedPacks.length > 1 ? 's' : '';
        this.packsReturnedListConfig = {
            header: {
                title: 'Colis scannés',
                info: `${returnedPacks.length} colis scanné${plural}`,
                leftIcon: {
                    name: 'scanned-pack.svg',
                    color: CardListColorEnum.PURPLE,
                }
            },
            body: returnedPacks.map((pack) => ({
                ...(TransportDepositPacksPage.packToListItemConfig(pack, natureTranslationCapitalized)),
                ...({
                        pressAction: () => {},
                        rightIcon: {
                            name: 'trash.svg',
                            color: 'danger',
                            action: () => this.revertPack(pack.code)
                        }
                    }
                ),
            }))
        };
    }

    public returnPack(barcode: string): void {
        const selectedIndex = this.packs.findIndex(({code}) => (code === barcode));
        if (selectedIndex > -1) {
            const selectedItem = this.packs[selectedIndex];
            if (selectedItem.returned) {
                this.alertService.show({
                    header: `Erreur`,
                    message: `Vous avez déjà traité ce colis`,
                    buttons: [{
                        text: `Fermer`,
                        role: `cancel`
                    }]
                });
            }
            else if(selectedItem.returning) {
                this.alertService.show({
                    header: `Erreur`,
                    message: `Vous avez déjà scanné ce colis`,
                    buttons: [{
                        text: `Fermer`,
                        role: `cancel`
                    }]
                });
            }
            else {
                this.packs.splice(selectedIndex, 1);
                this.packs.unshift(selectedItem);
                selectedItem.returning = true;
                this.refreshListToReturnConfig();
                this.refreshListReturnedConfig();
            }
        }
        else {
            this.alertService.show({
                header: `Erreur`,
                message: `Le colis scanné n'existe pas dans la liste`,
                buttons: [{
                    text: `Fermer`,
                    role: `cancel`
                }]
            });
        }
    }

    private returnAll(): void {
        this.packs
            .filter(({returning, returned}) => !returning && !returned)
            .forEach(({code}) => {
                this.returnPack(code);
            });
    }

    private revertPack(barcode: string): void {
        const selectedIndex = this.packs.findIndex(({code}) => code === barcode);
        if (selectedIndex > -1 && this.packs[selectedIndex].returning) {
            this.packs[selectedIndex].returning = false;

            this.refreshListToReturnConfig();
            this.refreshListReturnedConfig();
        }
    }

    private static packToListItemConfig({code, nature, color, temperature_range}: any, natureTranslation: string): any {
        return {
            infos: {
                code: {
                    label: 'Colis',
                    value: code
                },
                nature: {
                    label: natureTranslation,
                    value: nature
                },
                ...(temperature_range ? {
                    temperature_range: {
                        label: 'Température',
                        value: temperature_range
                    }
                } : {})
            },
            color: color
        }
    }

    public validate(): void {
        const returnedPacks = this.packs.filter(({returning, returned}) => returning && !returned);
        if (returnedPacks.length > 0) {
            this.navService.push(NavPathEnum.TRANSPORT_DEPOSIT_LOCATION, {
                everythingReturned: returnedPacks.length + this.packs.filter(({returned}) => returned).length === this.packs.length,
                depositedDeliveryPacks: returnedPacks,
                undeliveredPacksLocations: this.undeliveredPacksLocations,
                round: this.round,
                skippedMenu: this.navService.param('skippedMenu'),
                onValidate: () => {
                    for (const pack of returnedPacks) {
                        pack.returned = true;
                        pack.returning = false;
                    }

                    this.toastService.presentToast('Les colis ont bien été retournés');
                }
            });
        } else {
            this.toastService.presentToast('Veuillez retourner au moins un colis pour continuer');
        }
    }

}
