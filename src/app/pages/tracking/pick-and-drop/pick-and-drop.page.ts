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
import {PrisePage} from "@pages/prise-depose/prise/prise.page";
import {DeposePage} from "@pages/prise-depose/depose/depose.page";

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

    public pickLocation: Emplacement;
    public dropLocation: Emplacement;

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

    public listPacksOnLocationHeader: HeaderConfig;
    public listPacksOnLocationBody: Array<ListPanelItemConfig>;

    public currentPacksOnLocation: Array<MouvementTraca&{hidden?: boolean}>;

    private natureIdsToConfig: {[id: number]: { label: string; color?: string; }};

    private natureTranslations: Translations;
    private logisticUnitTranslations: Translations;

    private onValidate: () => void;

    private alreadyInitialized: boolean = false;

    public constructor(private navService: NavService,
                       public sqliteService: SqliteService,
                       public apiService: ApiService,
                       public networkService: NetworkService,
                       public loadingService: LoadingService,
                       public alertService: AlertService,
                       public translationService: TranslationService,
                       private trackingListFactory: TrackingListFactoryService,
                       private localDataManager: LocalDataManagerService,
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

    public async ionViewWillEnter() {
        if (!this.alreadyInitialized) {
            // prevent reload page and reload initial locations
            this.alreadyInitialized = true;
            this.pickLocation = this.navService.param('pickLocation');
            this.dropLocation = this.navService.param('dropLocation');
            const hasNetwork = await this.networkService.hasNetwork();

            this.loadingService
                .presentLoadingWhile({
                    event: () => zip(
                        this.storageService.getString(StorageKeyEnum.OPERATOR) as Observable<string>,
                        this.sqliteService.findAll('nature'),
                        this.translationService.get(null, `Traçabilité`, `Général`),
                        this.translationService.get(`Traçabilité`, `Unités logistiques`, `Divers`),
                        this.storageService.getRight(StorageKeyEnum.PARAMETER_DISPLAY_WARNING_WRONG_LOCATION),
                        (hasNetwork && this.pickLocation
                            ? this.apiService.requestApi(ApiService.GET_TRACKING_DROPS, {params: {location: this.pickLocation.label}})
                            : of({trackingDrops: []})),
                    )
                })
                .subscribe(([operator, natures, natureTranslations, logisticUnitTranslations, displayWarningWrongLocation, {trackingDrops}]) => {
                    if (natures) {
                        this.natureIdsToConfig = natures.reduce((acc, {id, color, label}: Nature) => ({
                            [id]: {label, color},
                            ...acc
                        }), {})
                    }

                    this.onValidate = this.navService.param('onValidate');
                    this.operator = operator;
                    this.displayWarningWrongLocation = displayWarningWrongLocation;
                    this.natureTranslations = natureTranslations;
                    this.logisticUnitTranslations = logisticUnitTranslations;
                    this.currentPacksOnLocation = trackingDrops;
                    this.trackingListFactory.enableActions();
                    this.footerScannerComponent.fireZebraScan();
                    this.generateForm();
                    this.refreshListComponent();
                });
        }
        else {
            this.trackingListFactory.enableActions();
            this.refreshListComponent();
        }
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
                    const {value: barcode} = object || {};
                    // we get first
                    const [dropIndex] = this.findTakingIndexes(barcode);
                    if (dropIndex !== undefined) {
                        const {quantity, comment, signature, photo, nature_id: natureId, freeFields, isGroup, subPacks, manualDelayStart} = this.colisPrise[dropIndex];
                        this.trackingListFactory.disableActions();
                        this.navService.push(NavPathEnum.MOVEMENT_CONFIRM, {
                            fromStock: false,
                            location: undefined,
                            barcode,
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
                                this.updatePicking(barcode, values);
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

        const {header: listPacksOnLocationHeader, body: listPacksOnLocationBody} = this.trackingListFactory.createListConfig(
            this.toTakeOngoingPacks,
            TrackingListFactoryService.LIST_TYPE_TAKING_SUB,
            {
                headerRightIcon: {
                    name: 'up.svg',
                    action: () => {
                        this.takeAll()
                    },
                },
                objectLabel: 'objet',
                natureIdsToConfig: this.natureIdsToConfig,
                natureTranslation: TranslationService.Translate(this.natureTranslations, 'Nature'),
                trackingDelayTranslation: TranslationService.Translate(this.logisticUnitTranslations, 'Délai de traitement'),
                rightIcon: {
                    mode: 'upload',
                    action: ({object}) => {
                        if (object.value) {
                            this.testIfBarcodeEquals(object.value, true);
                        }
                    }
                }
            }
        );

        this.listPacksOnLocationHeader = listPacksOnLocationHeader;
        this.listPacksOnLocationBody = listPacksOnLocationBody;
    }

    public generateForm() {
        this.bodyConfig = [
            {
                item: FormPanelSelectComponent,
                config: {
                    name: 'pickLocation',
                    value: this.pickLocation.id ?? null,
                    inputConfig: {
                        required: true,
                        disabled: true,
                        searchType: SelectItemTypeEnum.LOCATION,
                        onChange: (pickLocationId: any) => {
                            this.sqliteService.findOneById('emplacement', pickLocationId)
                                .subscribe((pickLocation: Emplacement) => {
                                    this.pickLocation = pickLocation
                                }
                            );
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
                    value: this.dropLocation.id ?? null,
                    inputConfig: {
                        required: true,
                        searchType: SelectItemTypeEnum.LOCATION,
                        onChange: (dropLocationId: any) => {
                            this.sqliteService.findOneById('emplacement', dropLocationId)
                                .subscribe((dropLocation: Emplacement) => {
                                    this.dropLocation = dropLocation;
                                }
                            );

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
        } else if (this.colisPrise.length === 0) {
            this.toastService.presentToast('Vous devez renseigner au moins une unité logistique.')
        } else {
            this.loadingService.presentLoadingWhile({
                event: () => this.postTrackingMovements(),
            }).subscribe(({responseStandardTrackingMovements, responseGroupTrackingMovements}) => {
                this.colisPrise = [];
                this.refreshListComponent();

                if(responseStandardTrackingMovements.success && responseGroupTrackingMovements.success) {
                    this.toastService.presentToast('Les prises et déposes ont bien été sauvegardées');
                    this.onValidate();
                }
                else if (!responseStandardTrackingMovements.success) {
                    this.localDataManager.treatTrackingMovementApiResponse(responseStandardTrackingMovements);
                }
                else if (!responseGroupTrackingMovements.success) {
                    this.toastService.presentToast(`Une erreur est survenue dans l'enregistrement des mouvements des groupes`);
                }
            });
        }
    }

    public async testIfBarcodeEquals(barcode: string, isManualAdd: boolean = false) {
        if(!this.pickLocation || !this.dropLocation) {
            this.toastService.presentToast("Veuillez d'abord renseigner les emplacements de prise et dépose")
        } else if (this.colisPrise && this.colisPrise.some((colis) => ((colis.ref_article || '').toLocaleLowerCase() === (barcode || '').toLocaleLowerCase()))) {
            this.toastService.presentToast('Cette prise a déjà été effectuée', {audio: true});
        }
        else {
            this.saveTrackingMovement(barcode, 1, false, false);

            const needNatureChecks = await this.networkService.hasNetwork();
            const [currentBarcodeIndex] = this.findTakingIndexes(barcode);
            if (currentBarcodeIndex !== undefined && currentBarcodeIndex > -1) {
                this.colisPrise[currentBarcodeIndex].loading = needNatureChecks;
            }

            if (needNatureChecks) {
                this.apiService
                    .requestApi(ApiService.GET_PACK_DATA, {
                        params: {
                            code: barcode,
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
                            if (this.displayWarningWrongLocation && ((location && `${this.pickLocation.id}` !== `${location}`) || !existing)) {
                                this.alertService.show({
                                    header: `Confirmation`,
                                    message: `Êtes-vous sûr que cet élément est présent sur cet emplacement ?`,
                                    backdropDismiss: false,
                                    buttons: [
                                        {
                                            text: 'Confirmer',
                                            cssClass: 'alert-success',
                                            handler: () => {
                                                this.processLogisticUnitTaking(isGroup, isPack, barcode, group, nature, trackingDelayData);
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
                                this.processLogisticUnitTaking(isGroup, isPack, barcode, group, nature, trackingDelayData);
                            }
                        },
                        error: () => {
                            this.updateTrackingMovementNature(barcode);
                        },
                    });
            }
        }
    }

    private findTakingIndexes(barcode?: string): Array<number> {
        return this.colisPrise.reduce(
            (acc: Array<number>, {ref_article}, currentIndex) => {
                if (ref_article === barcode) {
                    acc.push(currentIndex);
                }
                return acc;
            },
            []
        );
    }

    private cancelPickingAction(): (info: { [name: string]: { label?: string; value?: string; } }) => void {
        return TrackingListFactoryService.CreateRemoveItemFromListHandler(this.colisPrise, undefined, (barcode) => {
            this.refreshListComponent();
        });
    }

    private updatePicking(barcode: string|undefined,
                          {quantity, comment, signature, photo, projectId, natureId, freeFields, subPacks, manualDelayStart}: {quantity?: number; comment?: string; signature?: string; photo?: string; projectId?: number; natureId: number; freeFields: string; subPacks: any; manualDelayStart?: string;}): void {
        const dropIndexes = this.findTakingIndexes(barcode);
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

    private saveTrackingMovement(barcode: string, quantity: number, loading: boolean = false, containsArticle?: boolean): void {
        this.colisPrise.unshift({
            ref_article: barcode,
            type: PickAndDropPage.PICK_AND_DROP_TRACKING_MOVEMENT,
            operateur: this.operator,
            ref_emplacement: this.pickLocation.id.toString(),
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
                                      barcode: string,
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
                        Le colis ${barcode} est contenu dans le groupe ${group.code}.
                        <br>Voulez-vous prendre le groupe entier, l'Ul seule ou annuler ?
                    `,
                    buttons: [
                        {
                            text: 'Prise du groupe',
                            cssClass: 'alert-success full-width margin-right',
                            handler: () => {
                                this.updateTrackingMovementNature(barcode, nature && nature.id, group);
                            }
                        },
                        {
                            text: "Prise de l'UL",
                            cssClass: 'alert-danger full-width margin-right',
                            role: 'cancel',
                            handler: () => {
                                this.updateTrackingMovementNature(barcode, nature && nature.id);
                            }
                        },
                        {
                            text: 'Annuler',
                            cssClass: 'alert-danger full-width margin-right',
                            role: 'cancel',
                            handler: () => {
                                const cancelPicking = this.cancelPickingAction();
                                const value = isGroup && group ? group.code : barcode;
                                cancelPicking({object: {value: value, label: value}});
                            }
                        }
                    ]
                });
            }
            else {
                this.updateTrackingMovementNature(barcode, nature && nature.id, undefined, trackingDelayData);
            }
        }
        else { // isGroup === true
            this.updateTrackingMovementNature(barcode, nature && nature.id, group);
        }
    }

    private updateTrackingMovementNature(barcode: string, natureId?: number, groupData?: any, trackingDelayData?: any): void {
        const indexesToUpdate = this.findTakingIndexes(barcode);
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

    public get displayPacksOnLocationsList(): boolean {
        return this.currentPacksOnLocation && this.toTakeOngoingPacks.length > 0;
    }

    private get toTakeOngoingPacks() {
        return this.currentPacksOnLocation
            ? this.currentPacksOnLocation
                .filter(({hidden, ref_article: ongoingBarcode}) => (
                    !hidden
                    && !this.colisPrise.some(({ref_article: takeBarcode}) => takeBarcode === ongoingBarcode)
                ))
                .map(({subPacks, ...movements}) => movements)
            : [];
    }

    private takeAll() {
        this.toTakeOngoingPacks.forEach(({ref_article}) => {
            this.testIfBarcodeEquals(ref_article, true);
        });
    }

    private postTrackingMovements(): Observable<{ responseStandardTrackingMovements: any, responseGroupTrackingMovements: any }> {

        const trackingMovements = this.localDataManager.mapTrackingMovements(
            this.colisPrise
                .flatMap((movement) => [
                    {
                        ...movement,
                        ref_emplacement: this.pickLocation.label,
                        type: PrisePage.MOUVEMENT_TRACA_PRISE,
                    },
                    {
                        ...movement,
                        ref_emplacement: this.dropLocation.label,
                        type: DeposePage.MOUVEMENT_TRACA_DEPOSE,
                    }
                ])
        )
            // sort picking movements before drop movements
            .sort(({type: type1}, {type: type2}) => (
                type1 === PrisePage.MOUVEMENT_TRACA_PRISE ? -1 :
                type2 === PrisePage.MOUVEMENT_TRACA_PRISE ? 1 :
                0
            ));

        const standardTrackingMovements = trackingMovements.filter(({isGroup}) => !isGroup);
        const groupPickingMovements = trackingMovements.filter(({isGroup, type}) => isGroup && type === PrisePage.MOUVEMENT_TRACA_PRISE);
        const groupDropMovements = trackingMovements.filter(({isGroup, type}) => isGroup && type === DeposePage.MOUVEMENT_TRACA_DEPOSE);

        let responseStandardTrackingMovements: any;
        return (standardTrackingMovements.length > 0
            ? this.apiService.requestApi(ApiService.POST_TRACKING_MOVEMENTS, {
                params: this.localDataManager.extractTrackingMovementFiles(standardTrackingMovements)
            }).pipe(
                tap((apiResponse) => {
                    responseStandardTrackingMovements = apiResponse;
                })
            )
            : of({success: true}))
            .pipe(
                mergeMap(() => (groupPickingMovements.length > 0
                    ? this.apiService.requestApi(ApiService.POST_GROUP_TRACKINGS, {
                        pathParams: {mode: 'picking'},
                        params: this.localDataManager.extractTrackingMovementFiles(groupPickingMovements)
                    })
                    : of({success: true}))),
                mergeMap(({success: successGroupPicking}) => (successGroupPicking && groupDropMovements.length > 0
                    ? this.apiService.requestApi(ApiService.POST_GROUP_TRACKINGS, {
                        pathParams: {mode: 'drop'},
                        params: this.localDataManager.extractTrackingMovementFiles(groupDropMovements)
                    })
                    : of({success: successGroupPicking}))),
                map((responseGroupTrackingMovements) => ({
                    responseStandardTrackingMovements,
                    responseGroupTrackingMovements
                }))
            )
    }
}
