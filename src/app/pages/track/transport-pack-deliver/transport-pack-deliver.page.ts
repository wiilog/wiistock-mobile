import {Component, ViewChild} from '@angular/core';
import {NavService} from "@app/services/nav/nav.service";
import {TranslationService} from "@app/services/translations.service";
import {IconColor} from "@common/components/icon/icon-color";
import {CardListColorEnum} from "@common/components/card-list/card-list-color.enum";
import {TransportPack, TransportRoundLine} from '@database/transport-round-line';
import {HeaderConfig} from "@common/components/panel/model/header-config";
import {ListPanelItemConfig} from "@common/components/panel/model/list-panel/list-panel-item-config";
import {ToastService} from "@app/services/toast.service";
import {BarcodeScannerComponent} from "@common/components/barcode-scanner/barcode-scanner.component";
import {Translations} from "@database/translation";
import {SqliteService} from "@app/services/sqlite/sqlite.service";
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";
import {AlertService} from "@app/services/alert.service";
import {ApiService} from "@app/services/api.service";
import {zip} from 'rxjs';
import {LoadingService} from "@app/services/loading.service";
import {TransportRound} from "@database/transport-round";
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";

@Component({
    selector: 'wii-transport-pack-deliver',
    templateUrl: './transport-pack-deliver.page.html',
    styleUrls: ['./transport-pack-deliver.page.scss'],
})
export class TransportPackDeliverPage implements ViewWillEnter, ViewWillLeave {

    public readonly listBoldValues = ['code', 'nature', 'temperature_range'];
    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.INVISIBLE;

    private natureTranslations: Translations;
    private transport: TransportRoundLine;
    private round: TransportRound;
    private packs: Array<TransportPack>;
    public disabled: boolean = true;

    public packsToDeliverListConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };

    public packsDeliveredListConfig: {
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
        if (this.navService.popItem
            && this.navService.popItem.path !== NavPathEnum.TRANSPORT_PACK_DELIVER) {
            return;
        }
        this.transport = this.navService.param('transport');
        this.round = this.navService.param('round');
        this.packs = this.transport.packs;

        zip(
            this.loadingService.presentLoading('Récupération des données en cours'),
            this.translationService.get(null, `Traçabilité`, `Général`)
        )
            .subscribe(([loading, natureTranslations]: [HTMLIonLoadingElement, Translations]) => {
                this.natureTranslations = natureTranslations;
                loading.dismiss();

                this.refreshListDeliveredConfig();
                this.refreshListToDeliverConfig();
            });
    }

    public ionViewWillLeave(): void {
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    private refreshListToDeliverConfig(): void {
        const packsToDeliver = this.packs.filter(({delivered, rejected}) => (!delivered && !rejected));
        const natureTranslation = TranslationService.Translate(this.natureTranslations, 'Nature')
        const natureTranslationCapitalized = natureTranslation.charAt(0).toUpperCase() + natureTranslation.slice(1);

        const hasPackToDeliver = this.packs && this.packs.some(({delivered, rejected}) => !delivered && !rejected);
        this.packsToDeliverListConfig = {
            header: {
                title: 'Colis à déposer',
                info: `${packsToDeliver.length} colis`,
                leftIcon: {
                    name: 'packs-to-load.svg',
                    color: CardListColorEnum.PURPLE,
                },
                rightIconLayout: 'horizontal',
                ...(hasPackToDeliver
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
                                action: () => this.deliverAll()
                            }
                        ]
                    }
                    : {})
            },
            body: packsToDeliver.map((pack) => ({
                ...(TransportPackDeliverPage.packToListItemConfig(pack, natureTranslationCapitalized)),
                rightIcon: {
                    color: 'grey' as IconColor,
                    name: 'up.svg',
                    action: () => this.deliverPack(pack.code)
                },
            }))
        };
    }

    private refreshListDeliveredConfig(): void {
        const deliveredPacks = this.packs.filter(({delivered, rejected}) => delivered && !rejected);

        const natureTranslation = TranslationService.Translate(this.natureTranslations, 'Nature')
        const natureTranslationCapitalized = natureTranslation.charAt(0).toUpperCase() + natureTranslation.slice(1);

        const plural = deliveredPacks.length > 1 ? 's' : '';
        this.packsDeliveredListConfig = {
            header: {
                title: 'Colis déposés',
                subtitle: `Emplacement : Patient`,
                info: `${deliveredPacks.length} colis scanné${plural}`,
                leftIcon: {
                    name: 'scanned-pack.svg',
                    color: CardListColorEnum.PURPLE
                }
            },
            body: deliveredPacks.map((pack) => ({
                ...(TransportPackDeliverPage.packToListItemConfig(pack, natureTranslationCapitalized)),
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

    public deliverPack(barcode: string): void {
        const selectedIndex = this.packs.findIndex(({code}) => (code === barcode));
        if (selectedIndex > -1) {
            const selectedItem = this.packs[selectedIndex];
            if (selectedItem.delivered) {
                this.toastService.presentToast(`Vous avez déjà traité ce colis`);
            }
            else if (selectedItem.rejected) {
                this.toastService.presentToast(`Ce colis a été rejeté et n'est pas dans la liste`);
            }
            else {
                this.packs.splice(selectedIndex, 1);
                this.packs.unshift(selectedItem);
                selectedItem.delivered = true;
                if(this.packs.every(({delivered, rejected}) => delivered || rejected)) {
                    this.disabled = false;
                }
                this.refreshListToDeliverConfig();
                this.refreshListDeliveredConfig();
            }
        }
        else {
            this.toastService.presentToast(`Le colis scanné n'existe pas dans la liste`);
        }
    }

    private deliverAll(): void {
        this.packs
            .filter(({delivered, rejected}) => !delivered && !rejected)
            .forEach(({code}) => {
                this.deliverPack(code);
            });
    }

    private revertPack(barcode: string): void {
        const selectedIndex = this.packs.findIndex(({code}) => code === barcode);
        if (selectedIndex > -1 && this.packs[selectedIndex].delivered) {
            this.packs[selectedIndex].delivered = false;
            this.disabled = true;
            this.refreshListToDeliverConfig();
            this.refreshListDeliveredConfig();
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
        this.navService.push(NavPathEnum.FINISH_TRANSPORT, {
            transport: this.transport,
            round: this.round,
        });
    }
}
