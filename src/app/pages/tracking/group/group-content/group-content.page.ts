import {ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {HeaderConfig} from "@common/components/panel/model/header-config";
import * as moment from "moment";
import {SqliteService} from "@app/services/sqlite/sqlite.service";
import {NavService} from "@app/services/nav/nav.service";
import {ListPanelItemConfig} from "@common/components/panel/model/list-panel/list-panel-item-config";
import {ApiService} from "@app/services/api.service";
import {ToastService} from "@app/services/toast.service";
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {IconColor} from "@common/components/icon/icon-color";
import {MovementConfirmType} from "@pages/prise-depose/movement-confirm/movement-confirm-type";
import {BarcodeScannerComponent} from "@common/components/barcode-scanner/barcode-scanner.component";
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {LoadingService} from '@app/services/loading.service';
import {Subscription, zip} from 'rxjs';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";
import {AlertService} from "@app/services/alert.service";
import {TranslationService} from "@app/services/translations.service";
import {Translations} from "@entities/translation";

@Component({
    selector: 'wii-group-content',
    templateUrl: './group-content.page.html',
    styleUrls: ['./group-content.page.scss'],
})
export class GroupContentPage implements ViewWillEnter, ViewWillLeave {

    public readonly scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.WITH_MANUAL;

    public loadingSubscription?: Subscription;
    public listConfig: any;
    public listBoldValues: Array<string>;

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    private groupDate: string;
    private group: any;

    private apiPacksInProgress: Array<string>;

    private packTranslations: Translations;

    public constructor(private apiService: ApiService,
                       private toastService: ToastService,
                       private changeDetector: ChangeDetectorRef,
                       private loadingService: LoadingService,
                       private translationService: TranslationService,
                       private sqlService: SqliteService,
                       private alertService: AlertService,
                       private navService: NavService) {
        this.groupDate = moment().format('DD/MM/YYYY HH:mm:ss');
        this.listBoldValues = [
            'code',
            'quantity',
            'date',
            'delay',
            'limitTreatmentDate',
            'nature',
        ];
        this.apiPacksInProgress = [];
    }

    public async ionViewWillEnter() {
        this.loadingService
            .presentLoadingWhile({
                event: () => zip(
                    this.translationService.get(`Traçabilité`, `Unités logistiques`, `Divers`)
                )
            })
            .subscribe(async ([packTranslations]) => {
                this.packTranslations = packTranslations;

                this.apiPacksInProgress = [];
                if (this.footerScannerComponent) {
                    this.footerScannerComponent.fireZebraScan();
                }

                if(!this.group) {
                    this.group = this.navService.param(`group`);
                    this.group.newPacks = [];
                }

                this.listConfig = {
                    header: await this.createHeaderConfig(this.group),
                    body: await this.createBodyConfig(this.group.newPacks),
                };
            });
    }

    public ionViewWillLeave(): void {
        this.unsubscribeLoading();
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    public onPackScan(code: string): void {
        if (this.apiPacksInProgress.indexOf(code) > -1) {
            return;
        }

        const selectedIndex = this.group.newPacks.findIndex(({code: savedCode}: {code: string}) => (savedCode === code));

        if (selectedIndex > -1) {
            this.toastService.presentToast(`Le colis <b>${code}</b> est déjà présent dans le groupe`);
            return;
        }

        this.apiPacksInProgress.push(code);
        this.listConfig.header.info = this.headerGroupInfo;
        this.changeDetector.detectChanges();

        this.apiService.requestApi(ApiService.GET_PACK_DATA, {
            params: {
                code,
                group: 1,
                pack: 1,
                nature: 1,
                trackingDelayData: 1,
                splitCount: 1,
            }
        })
            .subscribe({
                next: ({isGroup, group, pack, nature, trackingDelayData, splitCount}) => {
                    if (isGroup) {
                        this.toastService.presentToast(`Le colis <b>${code}</b> est un groupe`);
                        this.refreshHeaderConfig();
                        this.updateInProgressPack(code);
                    } else if (group && group.code !== pack.code) { // pack is already a child in another group
                        this.showPackSplitModal(code, group, pack, nature, splitCount, trackingDelayData);
                    } else {
                        this.addPackToBody(code, nature, trackingDelayData, pack);
                    }
                },
                error: () => {
                    this.updateInProgressPack(code);
                    this.refreshHeaderConfig();
                }
            });
    }

    private refreshBodyConfig() {
        this.createBodyConfig(this.group.newPacks)
            .then(config => this.listConfig.body = config);
    }

    private refreshHeaderConfig() {
        this.createHeaderConfig(this.group)
            .then(header => this.listConfig.header = header);
    }

    private async createHeaderConfig(group: any): Promise<HeaderConfig> {
        const nature = await this.sqlService.findOneById(`nature`, group.natureId).toPromise();

        return {
            title: `Groupage`,
            info: this.headerGroupInfo,
            item: {
                infos: {
                    object: {
                        label: `Objet`,
                        value: group.code,
                    },
                    packs: {
                        label: `Nombre colis`,
                        value: group.packs.length,
                    },
                    ...(nature ? {
                        nature: {
                            label: `Nature`,
                            value: nature.label,
                        },
                    } : {}),
                },
                color: nature ? nature.color : undefined,
            },
            rightIcon: {
                name: 'check.svg',
                color: 'success',
                action: () => this.onSubmit(),
            },
            leftIcon: {
                name: 'group.svg'
            }
        };
    }

    private async createBodyConfig(packs: any): Promise<Array<ListPanelItemConfig>> {
        return await Promise.all(packs.map(async (pack: any) => {
            const nature = await this.sqlService.findOneById(`nature`, pack.nature_id).toPromise();

            const processingTimeLabel = TranslationService.Translate(this.packTranslations, 'Délai de traitement');

            return {
                color: nature ? nature.color : undefined,
                infos: {
                    code: {
                        label: 'Objet',
                        value: pack.code
                    },
                    quantity: {
                        label: 'Quantité',
                        value: pack.quantity
                    },
                    ...(pack.trackingDelay
                        ? {
                            delay: {
                                label: processingTimeLabel,
                                value: pack.trackingDelay,
                                color: pack.trackingDelayColor,
                            },
                            limitTreatmentDate: {
                                label: 'Date limite de traitement',
                                value: pack.limitTreatmentDate,
                            }
                        }
                        : {
                            date: {
                                label: 'Date/Heure',
                                value: pack.date
                            },
                        }
                    ),
                    ...(nature ? {
                        nature: {
                            label: `Nature`,
                            value: nature.label,
                        },
                    } : {}),
                },
                pressAction: () => {
                    const {quantity, comment, signature, photo, nature_id: natureId, freeFields} = pack;
                    this.navService.push(NavPathEnum.MOVEMENT_CONFIRM, {
                        group: this.group,
                        fromStock: false,
                        barCode: pack.code,
                        values: {
                            quantity,
                            comment,
                            signature,
                            natureId,
                            photo,
                            freeFields
                        },
                        movementType: MovementConfirmType.GROUP,
                        validate: (values: any) => {
                            pack.quantity = values.quantity;
                            pack.comment = values.comment;
                            pack.signature = values.signature;
                            pack.photo = values.photo;
                            pack.nature_id = values.natureId;
                            pack.freeFields = values.freeFields;
                            this.refreshBodyConfig();
                        },
                    });
                },
                rightIcon: {
                    name: 'trash.svg',
                    color: 'danger' as IconColor,
                    action: () => {
                        this.group.newPacks.splice(this.group.newPacks.indexOf(pack), 1);

                        this.refreshBodyConfig();
                        this.refreshHeaderConfig();
                    }
                }
            }
        }));
    }

    public onSubmit() {
        if (this.loadingSubscription) {
            return;
        }

        if (this.apiPacksInProgress.length > 0) {
            const errorMessage = this.apiPacksInProgress.length > 1
                ? `${this.apiPacksInProgress.length} unités logistiques sont en cours de synchronisation`
                : `une unité logistique est en cours de synchronisation`;

            this.toastService.presentToast(`Veuillez patienter, ${errorMessage}`);
            return;
        }

        const options = {
            params: {
                id: this.group.id,
                code: this.group.code,
                date: this.groupDate,
                packs: this.group.newPacks,
            }
        };

        this.loadingSubscription = this.loadingService
            .presentLoadingWhile({
                event: () => this.apiService.requestApi(ApiService.GROUP, options)
            })
            .subscribe({
                next: (response) => {
                    this.unsubscribeLoading();
                    if (response.success) {
                        this.toastService.presentToast(response.msg);
                        this.navService.pop().subscribe(() => this.navService.pop());
                    } else {
                        this.toastService.presentToast(`Erreur lors de la synchronisation du dégroupage`);
                    }
                },
                error: () => {
                    this.unsubscribeLoading();
                },
            });

    }

    private unsubscribeLoading() {
        if (this.loadingSubscription) {
            this.loadingSubscription.unsubscribe();
            this.loadingSubscription = undefined;
        }
    }

    private updateInProgressPack(code: string): void {
        const index = this.apiPacksInProgress.indexOf(code);
        if (index > -1) {
            this.apiPacksInProgress.splice(index, 1);
        }
    }

    private get headerGroupInfo(): string {
        const newPackCount = this.group.newPacks.length + this.apiPacksInProgress.length;
        const sScanned = newPackCount > 1 ? 's' : '';
        return `${newPackCount} objet${sScanned} scanné${sScanned}`;
    }

    private showPackSplitModal(code: string, group: any, pack: any, nature: any, splitCount: number, trackingDelayData?: any){
        this.alertService.show({
            header: "Confirmation d'action",
            backdropDismiss: false,
            cssClass: AlertService.CSS_CLASS_MANAGED_ALERT,
            message: `
                Le colis <b>${code}</b> est contenu dans le groupe ${group.code}.
                <br>Voulez-vous diviser votre colis ?
            `,
            buttons: [
                {
                    text: 'Diviser votre colis',
                    cssClass: 'alert-success',
                    handler: () => {
                        const packSplitNumber = this.group.newPacks.filter((newPack: any) => newPack.splitFromId && newPack.splitFromId === pack.id).length;
                        const codeSuffix = (
                            (Number(splitCount) || 0)
                            + (Number(packSplitNumber) || 0)
                            + 1
                        );
                        const newBarCode = `${code}.${codeSuffix}`;
                        this.addPackToBody(newBarCode, nature, trackingDelayData, null, pack);
                        this.updateInProgressPack(code);
                    }
                },
                {
                    text: 'Annuler',
                    cssClass: 'alert-danger',
                    role: 'cancel',
                    handler: () => {
                        this.updateInProgressPack(code);
                    }
                }
            ]
        });
    }

    private addPackToBody(barCode: string, nature: any, trackingDelayData?: any, pack?: any, splitFrom?: any){
        const newPack = pack || {
            code: barCode,
            nature_id: null,
            ...(splitFrom
                ? {
                    splitFromId: splitFrom.id,
                }
                : {}
            ),
        };

        newPack.quantity = newPack.quantity || 1;
        newPack.date = moment().format('DD/MM/YYYY HH:mm:ss');
        newPack.nature_id = nature && nature.id;

        if(trackingDelayData) {
            newPack.trackingDelay = trackingDelayData['delay'] || null;
            newPack.trackingDelayColor = trackingDelayData['color'] || null;
        }

        this.group.newPacks.push(newPack);

        this.refreshHeaderConfig();
        this.refreshBodyConfig();
        this.updateInProgressPack(barCode);
    }
}
