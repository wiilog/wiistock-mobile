import {Component, ViewChild} from '@angular/core';
import {ToastService} from '@app/services/toast.service';
import {NavService} from '@app/services/nav/nav.service';
import {StorageService} from '@app/services/storage/storage.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";
import {SqliteService} from "@app/services/sqlite/sqlite.service";
import {LoadingService} from "@app/services/loading.service";
import {FormPanelComponent} from "@common/components/panel/form-panel/form-panel.component";
import {FormPanelParam} from "@common/directives/form-panel/form-panel-param";
import {ApiService} from "@app/services/api.service";
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {BarcodeScannerComponent} from "@common/components/barcode-scanner/barcode-scanner.component";
import {TrackingListFactoryService} from "@app/services/tracking-list-factory.service";
import {HeaderConfig} from "@common/components/panel/model/header-config";
import {ListPanelItemConfig} from "@common/components/panel/model/list-panel/list-panel-item-config";
import {TranslationService} from "@app/services/translations.service";
import {MovementConfirmType} from "@pages/prise-depose/movement-confirm/movement-confirm-type";
import {MouvementTraca} from "@entities/mouvement-traca";
import {Observable, of, zip} from "rxjs";
import {Nature} from "@entities/nature";
import {Translations} from "@entities/translation";
import {map, mergeMap, tap} from "rxjs/operators";
import {NetworkService} from "@app/services/network.service";
import {AlertService} from "@app/services/alert.service";
import * as moment from "moment/moment";
import {StorageKeyEnum} from "@app/services/storage/storage-key.enum";
import {LocalDataManagerService} from "@app/services/local-data-manager.service";
import {Emplacement} from "@entities/emplacement";
import {
    FormPanelSelectComponent
} from "@common/components/panel/form-panel/form-panel-select/form-panel-select.component";
import {SelectItemTypeEnum} from "@common/components/select-item/select-item-type.enum";

@Component({
    selector: 'wii-pick-and-drop',
    templateUrl: './pick-and-drop.page.html',
    styleUrls: ['./pick-and-drop.page.scss'],
})
export class PickAndDropPage implements ViewWillEnter, ViewWillLeave {
    static readonly PICK_AND_DROP_TRACKING_MOVEMENT = 'pickAndDrop';

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public bodyConfig: Array<FormPanelParam> | any;

    public pickLocationId: number;
    public dropLocationId: number;

    public colisPrise: Array<MouvementTraca & {
        loading?: boolean;
        subPacks?: Array<MouvementTraca>;
    }>;

    public loading: boolean;
    public operator: string;
    public listBoldValues: Array<string>;

    public readonly scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.ONLY_MANUAL;
    public readonly listIdentifierName = TrackingListFactoryService.TRACKING_IDENTIFIER_NAME;

    public listPacksToTakeHeader: HeaderConfig;
    public listPacksToTakeBody: Array<ListPanelItemConfig>;
    public displayWarningWrongLocation: boolean;

    private natureIdsToConfig: {[id: number]: { label: string; color?: string; }};

    private natureTranslations: Translations;
    private logisticUnitTranslations: Translations;

    private onValidate: () => void;

    public constructor(private navService: NavService,
                       public sqliteService: SqliteService,
                       public apiService: ApiService,
                       public networkService: NetworkService,
                       public loadingService: LoadingService,
                       public alertService: AlertService,
                       public translationService: TranslationService,
                       private trackingListFactory: TrackingListFactoryService,
                       private localDataManagerService: LocalDataManagerService,
                       public storageService: StorageService,
                       public toastService: ToastService) {
        this.listBoldValues = [
            'object',
            'quantity',
            'articlesCount',
            'date',
            'nature',
            'trackingDelay',
            'limitTreatmentDate',
        ];
        this.colisPrise = [];
    }

    public ionViewWillEnter(): void {
        this.loadingService
            .presentLoadingWhile({
                event: () => zip(
                    this.storageService.getString(StorageKeyEnum.OPERATOR) as Observable<string>,
                    this.sqliteService.findAll('nature'),
                    this.translationService.get(null, `Traçabilité`, `Général`),
                    this.translationService.get(`Traçabilité`, `Unités logistiques`, `Divers`),
                    this.storageService.getRight(StorageKeyEnum.PARAMETER_DISPLAY_WARNING_WRONG_LOCATION),
                )
            })
            .subscribe(([operator, natures, natureTranslations, logisticUnitTranslations, displayWarningWrongLocation]) => {
                if (natures) {
                    this.natureIdsToConfig = natures.reduce((acc, {id, color, label}: Nature) => ({
                        [id]: {label, color},
                        ...acc
                    }), {})
                }

                this.pickLocationId = this.navService.param('pickLocationId');
                this.dropLocationId = this.navService.param('dropLocationId');
                this.onValidate = this.navService.param('onValidate');
                this.operator = operator;
                this.displayWarningWrongLocation = displayWarningWrongLocation;
                this.natureTranslations = natureTranslations;
                this.logisticUnitTranslations = logisticUnitTranslations;
                this.trackingListFactory.enableActions();
                this.footerScannerComponent.fireZebraScan();
                this.generateForm();
                this.refreshListComponent();
            });


    }

    public ionViewWillLeave() {
        this.footerScannerComponent.unsubscribeZebraScan();
    }

    private refreshListComponent(): void {
        const {header: listPacksToTakeHeader, body: listPacksToTakeBody} = this.trackingListFactory.createListConfig(
            this.colisPrise ?? [],
            TrackingListFactoryService.LIST_TYPE_PICK_AND_DROP,
            {
                objectLabel: 'objet',
                natureIdsToConfig: this.natureIdsToConfig,
                natureTranslation: TranslationService.Translate(this.natureTranslations, 'Nature'),
                trackingDelayTranslation: TranslationService.Translate(this.logisticUnitTranslations, 'Délai de traitement'),
                location: undefined,
                headerRightIcon: {
                    color: 'primary',
                    name: 'scan-photo.svg',
                    action: () => {
                        this.footerScannerComponent.scan();
                    }
                },
                confirmItem: (element: { object?: { value?: string } }) => {
                    const {object} = element || {};
                    const {value: barCode} = object || {};
                    // we get first
                    const [dropIndex] = this.findTakingIndexes(barCode);
                    if (dropIndex !== undefined) {
                        const {quantity, comment, signature, photo, nature_id: natureId, freeFields, isGroup, subPacks, manualDelayStart} = this.colisPrise[dropIndex];
                        this.trackingListFactory.disableActions();
                        this.navService.push(NavPathEnum.MOVEMENT_CONFIRM, {
                            fromStock: false,
                            location: undefined,
                            barCode,
                            isGroup,
                            subPacks,
                            values: {
                                quantity,
                                comment,
                                signature,
                                natureId,
                                photo,
                                freeFields,
                                manualDelayStart,
                            },
                            validate: (values: any) => {
                                this.updatePicking(barCode, values);
                            },
                            movementType: MovementConfirmType.PICK_AND_DROP,
                        });
                    }
                },
                rightIcon: {
                    mode: 'remove',
                    action: this.cancelPickingAction()
                },
            }
        );

        this.listPacksToTakeHeader = listPacksToTakeHeader;
        this.listPacksToTakeBody = listPacksToTakeBody;
    }

    public generateForm() {
        this.bodyConfig = [
            {
                item: FormPanelSelectComponent,
                config: {
                    name: 'pickLocation',
                    value: this.pickLocationId ?? null,
                    inputConfig: {
                        required: true,
                        searchType: SelectItemTypeEnum.LOCATION,
                        onChange: (pickLocationId: any) => {
                            this.pickLocationId = pickLocationId;
                        }
                    },
                    section: {
                        title: 'Emplacement de prise',
                        bold: true,
                    },
                    errors: {
                        required: 'Vous devez sélectionner un emplacement de prise.'
                    }
                }
            },
            {
                item: FormPanelSelectComponent,
                config: {
                    name: 'dropLocation',
                    value: this.dropLocationId ?? null,
                    inputConfig: {
                        required: true,
                        searchType: SelectItemTypeEnum.LOCATION,
                        onChange: (dropLocationId: any) => {
                            this.dropLocationId = dropLocationId;
                        }
                    },
                    section: {
                        title: 'Emplacement de dépose',
                        bold: true,
                    },
                    errors: {
                        required: 'Vous devez sélectionner un emplacement de dépose.'
                    }
                }
            },
        ];
    }

    public validate() {
        const firstError = this.formPanelComponent.firstError;
        if(firstError){
            this.toastService.presentToast(firstError);
        } else if(this.pickLocationId === this.dropLocationId) {
            this.toastService.presentToast('Vous ne pouvez pas sélectionner deux fois le même emplacement.')
        } else if (this.colisPrise.length === 0) {
            this.toastService.presentToast('Vous devez renseigner au moins une unité logistique.')
        } else {
            this.loadingService.presentLoadingWhile({
                event: () => this.apiService.requestApi(ApiService.POST_PICK_AND_DROP_TRACKING_MOVEMENTS, {
                    params: {
                        pickLocation: this.pickLocationId,
                        dropLocation: this.dropLocationId,
                        ...(this.localDataManagerService.extractTrackingMovementFiles(this.localDataManagerService.mapTrackingMovements(this.colisPrise, true), true)),
                    }
                }),
            }).subscribe((res) => {
                if(res.success) {
                    this.onValidate();
                }
            });
        }
    }

    public async testIfBarcodeEquals(barCode: string, isManualAdd: boolean = false) {
        if(!this.pickLocationId || !this.dropLocationId) {
            this.toastService.presentToast("Veuillez d'abord renseigner les emplacements de prise et dépose")
        } else if (this.colisPrise && this.colisPrise.some((colis) => ((colis.ref_article || '').toLocaleLowerCase() === (barCode || '').toLocaleLowerCase()))) {
            this.toastService.presentToast('Cette prise a déjà été effectuée', {audio: true});
        }
        else {
            this.saveTrackingMovement(barCode, 1, false, false);

            const needNatureChecks = await this.networkService.hasNetwork();
            const [currentBarcodeIndex] = this.findTakingIndexes(barCode);
            if (currentBarcodeIndex !== undefined && currentBarcodeIndex > -1) {
                this.colisPrise[currentBarcodeIndex].loading = needNatureChecks;
            }

            if (needNatureChecks) {
                this.apiService
                    .requestApi(ApiService.GET_PACK_DATA, {
                        params: {
                            code: barCode,
                            nature: 1,
                            group: 1,
                            trackingDelayData: 1,
                            location: 1,
                            existing: 1,
                        }
                    })
                    .pipe(
                        mergeMap(({nature, group, isPack, isGroup, location, existing, trackingDelayData}) => (
                            nature && !this.natureIdsToConfig[nature.id]
                                ? this.sqliteService.importNaturesData({natures: [nature]}, false)
                                    .pipe(
                                        map(() => ({nature, group, isPack, isGroup, location, existing, trackingDelayData}))
                                    )
                                : of({nature, group, isPack, isGroup, location, existing, trackingDelayData})
                        )),
                        tap(({nature}) => {
                            if (nature) {
                                const {id, color, label} = nature;
                                this.natureIdsToConfig[id] = {label, color};
                            }
                        }),
                    )
                    .subscribe({
                        next: ({nature, group, isPack, isGroup, location, existing, trackingDelayData}) => {
                            if (this.displayWarningWrongLocation && ((location && `${this.pickLocationId}` !== `${location}`) || !existing)) {
                                this.alertService.show({
                                    header: `Confirmation`,
                                    message: `Êtes-vous sûr que cet élément est présent sur cet emplacement ?`,
                                    backdropDismiss: false,
                                    buttons: [
                                        {
                                            text: 'Confirmer',
                                            cssClass: 'alert-success',
                                            handler: () => {
                                                this.processLogisticUnitTaking(isGroup, isPack, barCode, group, nature, trackingDelayData);
                                            },
                                        },
                                        {
                                            text: 'Annuler',
                                            role: 'cancel',
                                            handler: () => {
                                                this.colisPrise.shift();
                                                this.refreshListComponent();
                                            },
                                        },
                                    ]
                                });
                            } else {
                                this.processLogisticUnitTaking(isGroup, isPack, barCode, group, nature, trackingDelayData);
                            }
                        },
                        error: () => {
                            this.updateTrackingMovementNature(barCode);
                        },
                    });
            }
        }
    }

    private findTakingIndexes(barCode?: string): Array<number> {
        return this.colisPrise.reduce(
            (acc: Array<number>, {ref_article}, currentIndex) => {
                if (ref_article === barCode) {
                    acc.push(currentIndex);
                }
                return acc;
            },
            []
        );
    }

    private cancelPickingAction(): (info: { [name: string]: { label?: string; value?: string; } }) => void {
        return TrackingListFactoryService.CreateRemoveItemFromListHandler(this.colisPrise, undefined, (barCode) => {
            this.refreshListComponent();
        });
    }

    private updatePicking(barCode: string|undefined,
                          {quantity, comment, signature, photo, projectId, natureId, freeFields, subPacks, manualDelayStart}: {quantity?: number; comment?: string; signature?: string; photo?: string; projectId?: number; natureId: number; freeFields: string; subPacks: any; manualDelayStart?: string;}): void {
        const dropIndexes = this.findTakingIndexes(barCode);
        if (dropIndexes.length > 0) {
            for(const dropIndex of dropIndexes) {
                if (quantity && quantity > 0) {
                    this.colisPrise[dropIndex].quantity = quantity;
                }
                this.colisPrise[dropIndex].comment = comment;
                this.colisPrise[dropIndex].signature = signature;
                this.colisPrise[dropIndex].photo = photo;
                this.colisPrise[dropIndex].projectId = projectId;
                this.colisPrise[dropIndex].nature_id = natureId;
                this.colisPrise[dropIndex].freeFields = freeFields;
                this.colisPrise[dropIndex].subPacks = subPacks;
                this.colisPrise[dropIndex].manualDelayStart = manualDelayStart;
            }
            this.refreshListComponent();
        }
        this.footerScannerComponent.fireZebraScan();
    }

    private saveTrackingMovement(barCode: string, quantity: number, loading: boolean = false, containsArticle?: boolean): void {
        this.colisPrise.unshift({
            ref_article: barCode,
            type: PickAndDropPage.PICK_AND_DROP_TRACKING_MOVEMENT,
            operateur: this.operator,
            ref_emplacement: this.pickLocationId.toString(),
            finished: 0,
            loading,
            fromStock: Number(false),
            quantity,
            date: moment().format(),
            containsArticle
        });
    }

    private processLogisticUnitTaking(isGroup: boolean,
                                      isPack: boolean,
                                      barCode: string,
                                      group: any,
                                      nature: Nature,
                                      trackingDelayData: any): void {
        if (isPack || !isGroup) {
            if (group) {
                this.alertService.show({
                    header: 'Confirmation',
                    backdropDismiss: false,
                    cssClass: AlertService.CSS_CLASS_MANAGED_ALERT,
                    message: `
                        Le colis ${barCode} est contenu dans le groupe ${group.code}.
                        <br>Voulez-vous prendre le groupe entier, l'Ul seule ou annuler ?
                    `,
                    buttons: [
                        {
                            text: 'Prise du groupe',
                            cssClass: 'alert-success full-width margin-right',
                            handler: () => {
                                this.updateTrackingMovementNature(barCode, nature && nature.id, group);
                            }
                        },
                        {
                            text: "Prise de l'UL",
                            cssClass: 'alert-danger full-width margin-right',
                            role: 'cancel',
                            handler: () => {
                                this.updateTrackingMovementNature(barCode, nature && nature.id);
                            }
                        },
                        {
                            text: 'Annuler',
                            cssClass: 'alert-danger full-width margin-right',
                            role: 'cancel',
                            handler: () => {
                                const cancelPicking = this.cancelPickingAction();
                                const value = isGroup && group ? group.code : barCode;
                                cancelPicking({object: {value: value, label: value}});
                            }
                        }
                    ]
                });
            }
            else {
                this.updateTrackingMovementNature(barCode, nature && nature.id, undefined, trackingDelayData);
            }
        }
        else { // isGroup === true
            this.updateTrackingMovementNature(barCode, nature && nature.id, group);
        }
    }

    private updateTrackingMovementNature(barCode: string, natureId?: number, groupData?: any, trackingDelayData?: any): void {
        const indexesToUpdate = this.findTakingIndexes(barCode);
        for(const index of indexesToUpdate) {
            this.colisPrise[index].loading = false;

            if (groupData) {
                this.colisPrise[index].isGroup = 1;
                this.colisPrise[index].subPacks = groupData.packs;
                this.colisPrise[index].ref_article = groupData.code;
                this.colisPrise[index].nature_id = groupData.natureId;
            }
            else {
                this.colisPrise[index].nature_id = natureId;
            }

            this.colisPrise[index].trackingDelay = trackingDelayData?.delay;
            this.colisPrise[index].trackingDelayColor = trackingDelayData?.color;
            this.colisPrise[index].limitTreatmentDate = trackingDelayData?.limitTreatmentDate;
        }

        this.refreshListComponent();
        this.footerScannerComponent.fireZebraScan();
    }
}
