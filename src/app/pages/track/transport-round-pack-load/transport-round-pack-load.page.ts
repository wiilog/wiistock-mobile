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
    selector: 'wii-transport-round-pack-load',
    templateUrl: './transport-round-pack-load.page.html',
    styleUrls: ['./transport-round-pack-load.page.scss'],
})
export class TransportRoundPackLoadPage implements ViewWillEnter, ViewWillLeave {

    public readonly listBoldValues = ['code', 'nature', 'temperature_range'];
    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.INVISIBLE;

    private natureTranslations: Translations;
    private round: TransportRound;
    private packs: Array<{
        code: string;
        nature: string;
        nature_id: number;
        loaded: number;
        loading: boolean;
        rejected: boolean;
    }>;
    private packRejectMotives: Array<string>;
    private unpreparedDeliveries: () => void;

    public packsToLoadListConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };

    public packsLoadedListConfig: {
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
                       private loadingService: LoadingService,
                       private networkService: NetworkService) {
        this.natureIdsToColors = {};
    }

    public async ionViewWillEnter() {
        if (this.navService.popItem
            && this.navService.popItem.path !== NavPathEnum.TRANSPORT_ROUND_PACK_LOAD) {
            return;
        }

        this.round = this.navService.param('round');
        this.unpreparedDeliveries = this.navService.param('unpreparedDeliveries');
        this.packs = this.round.lines.reduce(
            (acc: Array<any>, line: TransportRoundLine) => [...(line.packs || []), ...acc],
            []
        ).filter(({loaded}) => !loaded);

        const hasNetwork = await this.networkService.hasNetwork();
        if (hasNetwork) {
            zip(
                this.loadingService.presentLoading('Récupération des données en cours'),
                this.apiService.requestApi(ApiService.GET_REJECT_MOTIVES),
                this.translationService.get(null, `Traçabilité`, `Général`)
            )
                .subscribe(([loading, {pack}, natureTranslations]: [HTMLIonLoadingElement, any, Translations]) => {
                    this.packRejectMotives = pack;
                    this.natureTranslations = natureTranslations;
                    loading.dismiss();

                    this.refreshListLoadedConfig();
                    this.refreshListToLoadConfig();
                });
        } else {
            this.toastService.presentToast('Veuillez vous connecter à internet pour continuer');
        }

        if (this.footerScannerComponent) {
            this.footerScannerComponent.fireZebraScan();
        }
    }

    public ionViewWillLeave(): void {
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    private refreshListToLoadConfig(): void {
        const packsToLoad = this.packs.filter(({loaded, loading, rejected}) => (!loaded && !loading && !rejected));
        const natureTranslation = TranslationService.Translate(this.natureTranslations, 'Nature')
        const natureTranslationCapitalized = natureTranslation.charAt(0).toUpperCase() + natureTranslation.slice(1);

        const hasPackToLoad = this.packs && this.packs.some(({loaded, loading, rejected}) => !loaded && !loading && !rejected);
        this.packsToLoadListConfig = {
            header: {
                title: 'Colis à charger',
                info: `${packsToLoad.length} colis`,
                leftIcon: {
                    name: 'packs-to-load.svg',
                    color: 'list-green-light'
                },
                rightIconLayout: 'horizontal',
                ...(hasPackToLoad
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
                                action: () => this.loadAll()
                            }
                        ]
                    }
                    : {})
            },
            body: packsToLoad.map((pack) => ({
                ...(TransportRoundPackLoadPage.packToListItemConfig(pack, natureTranslationCapitalized)),
                rightIcon: {
                    color: 'grey' as IconColor,
                    name: 'up.svg',
                    action: () => this.loadPack(pack.code)
                },
                sliding: true,
                slidingConfig: {
                    left: [{
                        label: 'Ecarter',
                        color: '#f53d3d',
                        action: () => this.dismiss(pack)
                    }]
                }
            }))
        };
    }

    private refreshListLoadedConfig(): void {
        const loadedPacks = this.packs.filter(({loaded, loading, rejected}) => !loaded && loading && !rejected);
        const natureTranslation = TranslationService.Translate(this.natureTranslations, 'Nature')
        const natureTranslationCapitalized = natureTranslation.charAt(0).toUpperCase() + natureTranslation.slice(1);

        const plural = loadedPacks.length > 1 ? 's' : '';
        this.packsLoadedListConfig = {
            header: {
                title: 'Colis scannés',
                info: `${loadedPacks.length} colis scanné${plural}`,
                leftIcon: {
                    name: 'scanned-pack.svg',
                    color: CardListColorEnum.PURPLE
                }
            },
            body: loadedPacks.map((pack) => ({
                ...(TransportRoundPackLoadPage.packToListItemConfig(pack, natureTranslationCapitalized)),
                ...({
                        pressAction: () => {},
                        rightIcon: {
                            name: 'trash.svg',
                            color: 'danger',
                            action: () => this.revertPack(pack.code)
                        }
                    }
                ),
                sliding: true,
                slidingConfig: {
                    left: [{
                        label: 'Ecarter',
                        color: '#f53d3d',
                        action: () => this.dismiss(pack)
                    }]
                },
            }))
        };
    }

    public loadPack(barCode: string): void {
        const selectedIndex = this.packs.findIndex(({code}) => (code === barCode));
        if (selectedIndex > -1) {
            const selectedItem = this.packs[selectedIndex];
            if(selectedItem.loaded) {
                this.alertService.show({
                    header: `Erreur`,
                    message: `Ce colis est déjà chargé`,
                    buttons: [{
                        text: `Fermer`,
                        role: `cancel`
                    }]
                });
            }
            else if (selectedItem.rejected) {
                this.alertService.show({
                    header: `Erreur`,
                    message: `Ce colis a été rejeté`,
                    buttons: [{
                        text: `Fermer`,
                        role: `cancel`
                    }]
                });
            }
            else if (selectedItem.loading) {
                this.alertService.show({
                    header: `Erreur`,
                    message: `Ce colis est déjà présent dans la liste des colis scannés`,
                    buttons: [{
                        text: `Fermer`,
                        role: `cancel`
                    }]
                });
            }
            else {
                this.packs.splice(selectedIndex, 1);
                this.packs.unshift(selectedItem);
                selectedItem.loading = true;
                this.refreshListToLoadConfig();
                this.refreshListLoadedConfig();
            }
        }
        else {
            this.alertService.show({
                header: 'Erreur',
                message: `Le colis a déjà été chargé ou n'est pas présent dans la liste des colis à charger`,
                buttons: [{
                    text: 'Fermer',
                    role: 'cancel'
                }]
            });
        }
    }

    private loadAll(): void {
        this.packs
            .filter(({loaded, loading, rejected}) => !loaded && !loading && !rejected)
            .forEach(({code}) => {
                this.loadPack(code);
            });
    }

    private revertPack(barCode: string): void {
        const selectedIndex = this.packs.findIndex(({code}) => code === barCode);
        if (selectedIndex > -1 && this.packs[selectedIndex].loading) {
            this.packs[selectedIndex].loading = false;

            this.refreshListToLoadConfig();
            this.refreshListLoadedConfig();
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
        const loadedPacks = this.packs.filter(({loaded, loading, rejected}) => !loaded && loading && !rejected);
        const packsToLoad = this.packs.filter(({loaded, loading, rejected}) => (!loaded && !loading && !rejected)).length;

        if (loadedPacks.length > 0) {
            this.navService.push(NavPathEnum.TRANSPORT_ROUND_PACK_LOAD_VALIDATE, {
                everythingLoaded: packsToLoad == 0,
                unpreparedDeliveries: this.unpreparedDeliveries,
                packs: loadedPacks,
                round: this.round,
                onValidate: () => {
                    for (const pack of loadedPacks) {
                        pack.loaded = 1;
                        pack.loading = false;
                    }

                    this.toastService.presentToast('Les colis ont bien été chargés');
                }
            });
        } else {
            this.toastService.presentToast('Veuillez charger au moins un colis pour continuer');
        }
    }

    public async dismiss(pack: {code: string}) {
        const hasNetwork = await this.networkService.hasNetwork();
        if (hasNetwork) {
            if (this.packRejectMotives.length > 0) {
                const formattedRejectMotives = this.packRejectMotives.reduce((acc: Array<any>, rejectMotive: string) => {
                    acc.push({
                        label: rejectMotive,
                        name: rejectMotive,
                        value: rejectMotive,
                        type: 'radio',
                    });
                    return acc;
                }, []);

                this.alertService.show({
                    header: `Écarter le colis`,
                    subHeader: pack.code,
                    inputs: formattedRejectMotives,
                    buttons: [
                        {
                            text: 'Annuler',
                            role: 'cancel'
                        },
                        {
                            text: 'Valider',
                            handler: (rejectMotive): boolean|void => {
                                if (rejectMotive) {
                                    const options = {
                                        params: {
                                            pack: pack.code,
                                            rejectMotive: rejectMotive,
                                            round: this.round.id
                                        }
                                    };
                                    zip(
                                        this.loadingService.presentLoading(),
                                        this.apiService.requestApi(ApiService.REJECT_PACK, options),
                                    )
                                        .subscribe(([loading, response]: [HTMLIonLoadingElement, any]) => {
                                            if (response && response.success) {
                                                loading.dismiss();
                                                const selectedIndex = this.packs.findIndex(({code}) => (code === pack.code));
                                                this.packs[selectedIndex].rejected = true;

                                                this.refreshListLoadedConfig();
                                                this.refreshListToLoadConfig();

                                                this.toastService.presentToast(`Le colis <strong>${pack.code}</strong> a bien été écarté`);

                                                if (response.rejectedRound) {
                                                    this.toastService.presentToast(`La livraison a été rejetée`);
                                                    this.navService.pop();
                                                }
                                            }
                                        });
                                } else {
                                    this.toastService.presentToast(`Veuillez renseigner un motif d'écartement`)
                                    return false;
                                }
                            }
                        }
                    ]
                }, undefined, false);
            } else {
                this.toastService.presentToast(`Aucun motif d'écartement n'a été paramétré`)
            }
        } else {
            this.toastService.presentToast(`Veuillez vous connecter à internet afin d'écarter un colis`);
        }
    }
}
