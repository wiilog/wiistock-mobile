import {Component, EventEmitter, ViewChild} from '@angular/core';
import {Observable, Subscription, zip} from 'rxjs';
import {LoadingService} from '@app/services/loading.service';
import {CardListColorEnum} from '@common/components/card-list/card-list-color.enum';
import {BarcodeScannerModeEnum} from "@common/components/barcode-scanner/barcode-scanner-mode.enum";
import {Translations} from '@entities/translation';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";
import {ApiService} from "@app/services/api.service";
import {NavService} from "@app/services/nav/nav.service";
import {TrackingRound} from "@entities/tracking-round";
import {HeaderConfig} from "@common/components/panel/model/header-config";
import {PanelHeaderComponent} from "@common/components/panel/panel-header/panel-header.component";
import {BarcodeScannerComponent} from "@common/components/barcode-scanner/barcode-scanner.component";
import {TrackingRoundLine} from "@entities/tracking-round-line";
import {TabConfig} from "@common/components/tab/tab-config";
import {FormPanelComponent} from "@common/components/panel/form-panel/form-panel.component";
import {TrackingListFactoryService} from "@app/services/tracking-list-factory.service";
import {FormPanelParam} from "@common/directives/form-panel/form-panel-param";
import {FormPanelInputComponent} from "@common/components/panel/form-panel/form-panel-input/form-panel-input.component";
import {
    FormPanelCameraComponent
} from "@common/components/panel/form-panel/form-panel-camera/form-panel-camera.component";
import {ListPanelItemConfig} from "@common/components/panel/model/list-panel/list-panel-item-config";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";
import {MouvementTraca} from "@entities/mouvement-traca";
import * as moment from "moment/moment";
import {StorageKeyEnum} from "@app/services/storage/storage-key.enum";
import {StorageService} from "@app/services/storage/storage.service";
import {SqliteService} from "@app/services/sqlite/sqlite.service";
import {Nature} from "@entities/nature";
import {ToastService} from "@app/services/toast.service";
import {TranslationService} from "@app/services/translations.service";
import {AlertService} from "@app/services/alert.service";
import {MovementConfirmType} from "@pages/prise-depose/movement-confirm/movement-confirm-type";
import {LocalDataManagerService} from "@app/services/local-data-manager.service";


enum PageMode {
    PICK = 1,
    DROP = 2,
    EMPTY_ROUND = 3,
}

@Component({
    selector: 'wii-tracking-round-movement',
    templateUrl: './tracking-round-movement.page.html',
    styleUrls: ['./tracking-round-movement.page.scss'],
})
export class TrackingRoundMovementPage implements ViewWillEnter, ViewWillLeave {
    public readonly barcodeScannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.WITH_MANUAL;

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    @ViewChild('formHeaderComponent', {static: false})
    public formHeaderComponent: PanelHeaderComponent;

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public listBoldValues: Array<string>;

    public readonly listIdentifierName = TrackingListFactoryService.TRACKING_IDENTIFIER_NAME;

    public readonly PageMode = PageMode;

    private loadingSubscription?: Subscription;

    public loading: boolean;
    public fabListActivated: boolean;
    public isStarted: boolean;

    public resetEmitter$: EventEmitter<void>;

    public pickListConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };

    public dropListConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };

    public pickPacks: Array<MouvementTraca & {
        loading?: boolean;
        subPacks?: Array<MouvementTraca>;
        articles?: Array<string>;
    }>;

    public dropPacks: Array<MouvementTraca & {
        loading?: boolean;
        subPacks?: Array<MouvementTraca>;
        articles?: Array<string>;
    }>;

    public ongoingPacks: Array<MouvementTraca & {
        loading?: boolean;
        subPacks?: Array<MouvementTraca>;
        articles?: Array<string>;
    }>;

    public emptyRoundBodyConfig: Array<FormPanelParam>;

    public trackingRoundHeaderConfig: HeaderConfig;

    public trackingRoundTranslations: Translations;

    private natureIdsToConfig: {[id: number]: { label: string; color?: string; }};
    private allowedNatureIdsForLocation: Array<number>;
    private natureTranslations: Translations;

    public messageLoading?: string;
    private operator: string;

    public trackingRound: TrackingRound;
    public trackingRoundLine: TrackingRoundLine;

    public currentPageMode: PageMode;

    public tabConfig: TabConfig[] = [
        { label: 'Prise', key: PageMode.PICK },
        { label: 'Dépose', key: PageMode.DROP },
        { label: 'Passage à vide', key: PageMode.EMPTY_ROUND }
    ];

    public constructor(private loadingService: LoadingService,
                       private apiService: ApiService,
                       private localDataManager: LocalDataManagerService,
                       private sqliteService: SqliteService,
                       private storageService: StorageService,
                       private toastService: ToastService,
                       private translationService: TranslationService,
                       private trackingListFactory: TrackingListFactoryService,
                       private alertService: AlertService,
                       private navService: NavService) {
        this.resetEmitter$ = new EventEmitter<void>();
        this.loading = true;
        this.fabListActivated = false
        this.pickPacks = [];
        this.ongoingPacks = [];
        this.dropPacks = [];
        this.messageLoading = "Récupération de la tournée en cours...";
        this.listBoldValues = ['object', 'nature', 'quantity', 'date'];
    }


    public ionViewWillEnter(): void {
        this.trackingListFactory.enableActions();
        this.loading = true;
        this.resetEmitter$.emit();
        this.trackingRound = this.navService.param('trackingRound');
        this.trackingRoundLine = this.navService.param('trackingRoundLine');
        this.loadingService.presentLoadingWhile({
            event: () => zip(
                this.apiService.requestApi(ApiService.GET_ONGOING_PACKS, {
                    pathParams: {
                        trackingRound: this.trackingRound.id,
                    }
                }),
                this.storageService.getString(StorageKeyEnum.OPERATOR) as Observable<string>,
                this.sqliteService.findAll('nature'),
                this.sqliteService.findBy('allowed_nature_location', ['location_id = ' + this.trackingRoundLine.locationId]),
                this.translationService.get(null, `Traçabilité`, `Général`),
            ),
        }).subscribe(([ongoingPacks, operator, natures, allowedNatureLocationArray, natureTranslations]) => {
            this.ongoingPacks = ongoingPacks.ongoingPacks;
            this.currentPageMode = PageMode.PICK;
            this.operator = operator;
            this.natureTranslations = natureTranslations;

            this.natureIdsToConfig = natures.reduce((acc, {id, color, label}: Nature) => ({
                [id]: {label, color},
                ...acc
            }), {});

            this.tabConfig = [
                { label: 'Prise', key: PageMode.PICK},
                { label: 'Dépose', key: PageMode.DROP },
                { label: 'Passage à vide', key: PageMode.EMPTY_ROUND, disabled: this.trackingRoundLine.checked }
            ];

            this.allowedNatureIdsForLocation = allowedNatureLocationArray.map(({nature_id}) => nature_id)

            this.refreshTrackingRoundLineHeaderConfig();
            this.loading = false;
        });
    }

    public ionViewWillLeave(): void {
        this.unsubscribeLoading();
        this.trackingListFactory.disableActions();
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

    private refreshTrackingRoundLineHeaderConfig(): void {
        this.trackingRoundHeaderConfig = {
            title: `${this.trackingRound.typeLabel}`,
            subtitle: `${this.trackingRoundLine.locationLabel || ''}`,
            info: this.trackingRound.number,
            transparent: true,
            leftIcon: {
                color: CardListColorEnum.LIGHT_BLUE,
                customColor: this.trackingRound.typeColor,
                name: 'tracking-round.svg'
            },
        };
    }

    public testIfBarcodeEquals(scannedCode: string): void {
        this.loadingService
            .presentLoadingWhile({
                event: () => this.apiService.requestApi(ApiService.GET_PACK_DATA, {
                    params: {
                        code: scannedCode,
                        nature: 1,
                    }
                })
            })
            .subscribe(({nature}) => {
                if(this.currentPageMode === PageMode.PICK) {
                    if (this.findPickingIndex(scannedCode) === -1) {
                        this.pickPacks.unshift({
                            ref_article: scannedCode,
                            type: 'prise',
                            operateur: this.operator,
                            ref_emplacement: this.trackingRoundLine.locationLabel,
                            nature_id: nature ? nature.id : null,
                            finished: 0,
                            quantity: 1,
                            date: moment().format(),
                            loading: false,
                            containsArticle: false,
                        });
                        this.refreshList();
                    } else {
                        this.toastService.presentToast(`Cette unité logistique a déjà été ajoutée.`);
                    }
                } else if(this.currentPageMode === PageMode.DROP) {
                    this.saveMouvementTraca(scannedCode);
                }
            });
    }

    public reloadPage() {
        if(this.currentPageMode === PageMode.EMPTY_ROUND) {
            this.emptyRoundBodyConfig = [
                {
                    item: FormPanelInputComponent,
                    config: {
                        label: 'Commentaire',
                        name: 'comment',
                        inputConfig: {
                            type: 'text',
                            maxLength: '255'
                        },
                        errors: {
                            required: 'Votre commentaire est requis',
                            maxlength: 'Votre commentaire est trop long',
                        }
                    }
                },
                {
                    item: FormPanelCameraComponent,
                    config: {
                        label: 'Photo',
                        name: 'photo',
                        inputConfig: {}
                    }
                }
            ]
        }
        this.refreshList();
    }

    public get pickListHeaderConfig(): HeaderConfig|undefined {
        return this.currentPageMode === PageMode.DROP ? this.pickListConfig.header : undefined;
    }

    public get displayPickList(): boolean {
        return [PageMode.DROP, PageMode.PICK].includes(this.currentPageMode) && Boolean(this.pickListConfig);
    }

    public refreshList(): void {
        this.pickListConfig = this.trackingListFactory.createListConfig(
            this.listConfig,
            TrackingListFactoryService.LIST_TYPE_DROP_SUB,
            {
                ...this.currentPageMode === PageMode.DROP
                    ? {
                        headerRightIcon: [
                            {
                                color: 'primary',
                                name: 'scan-photo.svg',
                                action: () => {
                                    this.footerScannerComponent.scan();
                                }
                            },
                            {
                                name: 'up.svg',
                                action: () => {
                                    this.dropAll()
                                },
                            }
                        ],
                    }
                    : {},
                ...(this.currentPageMode === PageMode.DROP
                    ? {
                        rightIcon: {
                            mode: 'upload',
                            action: ({object: {value}}) => {
                                this.saveMouvementTraca(value);
                            }
                        },
                    }
                    : {
                        rightIcon: {
                            mode: 'remove',
                            action: this.cancelAction(),
                        },
                    }),
                confirmItem: (element: { object?: { value?: string } }) => {
                        const {object} = element || {};
                        const {value: barcode} = object || {};

                        const packIndex = this.currentPageMode === PageMode.PICK
                            ? this.findPickingIndex(barcode)
                            : (this.currentPageMode === PageMode.DROP
                                ? this.findOngoingIndex(barcode)
                                : undefined);

                        if (packIndex !== undefined) {
                            const {quantity, comment, signature, photo, nature_id: natureId, freeFields, isGroup, subPacks, manualDelayStart} = this.listConfig[packIndex];
                            this.trackingListFactory.disableActions();
                            this.navService.push(NavPathEnum.MOVEMENT_CONFIRM, {
                                fromStock: false,
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
                                movementType: MovementConfirmType.TAKE,
                            });
                        }
                    },
                natureIdsToConfig: this.natureIdsToConfig,
                natureTranslation: TranslationService.Translate(this.natureTranslations, 'Nature'),
                objectLabel: 'prise',
            }
        );

        this.dropListConfig = this.trackingListFactory.createListConfig(
            this.dropPacks,
            TrackingListFactoryService.LIST_TYPE_DROP_MAIN,
            {
                rightIcon: {
                    mode: 'remove',
                    action: this.cancelAction(),
                },
                natureIdsToConfig: this.natureIdsToConfig,
                natureTranslation: TranslationService.Translate(this.natureTranslations, 'Nature'),
                objectLabel: 'dépose',
            }
        );
    }

    public get listConfig() {
        return this.currentPageMode === PageMode.PICK
            ? this.pickPacks
            : this.ongoingPacks ;
    }

    private cancelAction(): (info: { [name: string]: { label?: string; value?: string; } }) => void {
        return TrackingListFactoryService.CreateRemoveItemFromListHandler(
            this.currentPageMode === PageMode.PICK ? this.pickPacks : this.dropPacks,
            this.currentPageMode === PageMode.PICK ? undefined : this.ongoingPacks,
            (barcode) => {
                this.refreshList();
            }
        );
    }

    private dropAll() {
        this.pickPacks
            .forEach(({ref_article}) => {
                this.saveMouvementTraca(ref_article)
            });

        this.refreshList();
    }

    private saveMouvementTraca(packCode?: string): void {
        const pickingIndex = this.findOngoingIndex(packCode);

        if (pickingIndex > -1) {
            const allowedMovement = (
                this.allowedNatureIdsForLocation.length === 0
                || (this.allowedNatureIdsForLocation.some((nature_id) => (nature_id === this.pickPacks[pickingIndex].nature_id)))
            );

            if (allowedMovement) {
                const picking = this.ongoingPacks[pickingIndex];
                if (this.findDropIndex(packCode) === -1) {
                    let quantity = picking.quantity;

                    this.dropPacks.unshift({
                        articles: picking.articles,
                        ref_article: picking.ref_article,
                        nature_id: picking.nature_id,
                        quantity,
                        type: 'depose',
                        operateur: this.operator,
                        ref_emplacement: this.trackingRoundLine.locationLabel,
                        date: moment().format(),
                        containsArticle: picking.containsArticle,
                    });

                    const remover = TrackingListFactoryService.CreateRemoveItemFromListHandler(
                        this.ongoingPacks,
                        undefined,
                        () => {
                            this.refreshList();
                        }
                    );

                    remover({object: {value: picking.ref_article}});

                    this.footerScannerComponent.fireZebraScan();
                }
            }
            else {
                const natureLabel = TranslationService.Translate(this.natureTranslations, 'Nature').toLowerCase();
                const {ref_article, nature_id} = this.dropPacks[pickingIndex] || {};
                const nature = nature_id ? this.natureIdsToConfig[nature_id] : undefined;
                const natureValue = (nature ? nature.label : 'non défini');
                this.alertService.show({
                    header: 'Erreur',
                    cssClass: AlertService.CSS_CLASS_MANAGED_ALERT,
                    message: `Le colis <strong>${ref_article}</strong>`
                        + ` de ${natureLabel} <strong>${natureValue}</strong>`
                        + ` ne peut pas être déposé sur l'emplacement <strong>${this.trackingRoundLine.locationLabel}</strong>.`,
                    buttons: [{
                        text: 'Confirmer',
                        cssClass: 'alert-danger'
                    }]
                });
            }
        }
        this.refreshList();
    }

    private findPickingIndex(packCode: string|undefined): number {
        return this.pickPacks.findIndex(({ref_article}) => (ref_article === packCode));
    }

    private findOngoingIndex(packCode: string|undefined): number {
        return this.ongoingPacks.findIndex(({ref_article}) => (ref_article === packCode));
    }

    private findDropIndex(packCode: string|undefined): number {
        return this.dropPacks.findIndex(({ref_article}) => (ref_article === packCode));
    }

    public validate() {
        this.loadingService.presentLoadingWhile({
            event: () => this.apiService.requestApi(ApiService.SAVE_TRACKING_ROUND_MOVEMENTS, {
                pathParams: {
                    trackingRound: this.trackingRound.id,
                },
                params: {
                    ...(this.currentPageMode === PageMode.PICK
                        ? this.localDataManager.extractTrackingMovementFiles(this.localDataManager.mapTrackingMovements(this.pickPacks))
                        : (this.currentPageMode === PageMode.DROP
                            ? this.localDataManager.extractTrackingMovementFiles(this.localDataManager.mapTrackingMovements(this.dropPacks))
                            : [{
                                mouvements: {
                                    ref_emplacement: this.trackingRoundLine.locationLabel,
                                    operateur: this.operator,
                                    date: moment().format(),
                                    ...(this.formPanelComponent.values)
                                }
                            }])
                    ),
                    action: this.currentPageMode === PageMode.PICK
                        ? 'pick'
                        : (this.currentPageMode === PageMode.DROP
                            ? 'drop'
                            : 'empty_round'),
                }
            })
        }).subscribe((res) => {
            if(res.success) {
                this.navService.pop({
                    path: NavPathEnum.TRACKING_ROUND_DETAILS,
                    params: {
                        trackingRoundId: res.trackingRoundId
                    }
                });
            } else {
                this.toastService.presentToast(res.message);
            }
        });
    }

    private updatePicking(barcode: string|undefined,
                          {quantity, comment, signature, photo, projectId, natureId, freeFields, subPacks, manualDelayStart}: {quantity?: number; comment?: string; signature?: string; photo?: string; projectId?: number; natureId: number; freeFields: string; subPacks: any; manualDelayStart?: string;}): void {
        const packIndex = this.currentPageMode === PageMode.PICK
            ? this.findPickingIndex(barcode)
            : (this.currentPageMode === PageMode.DROP
                ? this.findOngoingIndex(barcode)
                : -1);
        if (packIndex > -1) {
            if (quantity && quantity > 0) {
                this.listConfig[packIndex].quantity = quantity;
            }

            console.log(freeFields);
            this.listConfig[packIndex].comment = comment;
            this.listConfig[packIndex].signature = signature;
            this.listConfig[packIndex].photo = photo;
            this.listConfig[packIndex].projectId = projectId;
            this.listConfig[packIndex].nature_id = natureId;
            this.listConfig[packIndex].freeFields = freeFields;
            this.listConfig[packIndex].subPacks = subPacks;
            this.listConfig[packIndex].manualDelayStart = manualDelayStart;
            this.refreshList();
        }
        this.footerScannerComponent.fireZebraScan();
    }
}
