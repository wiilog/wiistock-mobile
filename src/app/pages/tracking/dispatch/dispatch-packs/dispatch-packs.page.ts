import {ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {Observable, of, Subscription, zip} from 'rxjs';
import {NavService} from '@app/services/nav/nav.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {LoadingService} from '@app/services/loading.service';
import {filter, map, mergeMap, tap} from 'rxjs/operators';
import {Dispatch} from '@entities/dispatch';
import {CardListColorEnum} from '@common/components/card-list/card-list-color.enum';
import {MainHeaderService} from '@app/services/main-header.service';
import {IconConfig} from '@common/components/panel/model/icon-config';
import {DispatchPack} from '@entities/dispatch-pack';
import {HeaderConfig} from '@common/components/panel/model/header-config';
import {ListPanelItemConfig} from '@common/components/panel/model/list-panel/list-panel-item-config';
import {Nature} from '@entities/nature';
import {IconColor} from '@common/components/icon/icon-color';
import {BarcodeScannerComponent} from '@common/components/barcode-scanner/barcode-scanner.component';
import {Translations} from '@entities/translation';
import {ToastService} from '@app/services/toast.service';
import {BarcodeScannerModeEnum} from '@common/components/barcode-scanner/barcode-scanner-mode.enum';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {TranslationService} from "@app/services/translations.service";
import {ApiService} from "@app/services/api.service";
import {FileService} from "@app/services/file.service";
import {StorageKeyEnum} from "@app/services/storage/storage-key.enum";
import {StorageService} from "@app/services/storage/storage.service";
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";
import {Browser} from '@capacitor/browser';
import {Status} from "@entities/status";
import * as moment from "moment";
import {DispatchReference} from "@entities/dispatch-reference";

@Component({
    selector: 'wii-dispatch-packs',
    templateUrl: './dispatch-packs.page.html',
    styleUrls: ['./dispatch-packs.page.scss'],
})
export class DispatchPacksPage implements OnInit, ViewWillEnter, ViewWillLeave {

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public loading: boolean;
    public wayBillData = {};
    public hasWayBillData = false;
    public dispatchOfflineMode = false;
    public scannerMode: BarcodeScannerModeEnum;

    public dispatchHeaderConfig: {
        title: string;
        subtitle?: Array<string>;
        info?: string;
        transparent: boolean;
        leftIcon: IconConfig;
        rightIcon?: IconConfig;
    };

    public packsToTreatListConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };
    public packsTreatedListConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };

    public readonly listBoldValues = ['code', 'reference', 'quantity', 'nature'];

    public dispatch: Dispatch;
    public fromCreate: boolean = false;
    public viewMode: boolean = false;
    public ableToCreateWaybill: boolean = false;
    private dispatchPacks: Array<DispatchPack>;
    private dispatchReferences: Array<DispatchReference>;

    private typeHasNoPartialStatuses: boolean;

    private natureIdsToColors: {[natureId: number]: string};
    private natureIdsToLabels: {[natureId: number]: string};
    private natureTranslations: Translations;

    private loadingSubscription?: Subscription;
    private loadingElement?: HTMLIonLoadingElement;

    private fieldParams: {
        displayCarrierTrackingNumber: Array<string>,
        needsCarrierTrackingNumber: Array<string>,
        displayPickLocation: Array<string>,
        needsPickLocation: Array<string>,
        displayDropLocation: Array<string>,
        needsDropLocation: Array<string>,
        displayComment: Array<string>,
        needsComment: Array<string>,
        displayEmergency: Array<string>,
        needsEmergency: Array<string>,
        displayReceiver: Array<string>,
        needsReceiver: Array<string>,
        displayEmails: Array<string>,
        needsEmails: Array<string>,
    } = {
        displayCarrierTrackingNumber: [],
        needsCarrierTrackingNumber: [],
        displayPickLocation: [],
        needsPickLocation: [],
        displayDropLocation: [],
        needsDropLocation: [],
        displayComment: [],
        needsComment: [],
        displayEmergency: [],
        needsEmergency: [],
        displayReceiver: [],
        needsReceiver: [],
        displayEmails: [],
        needsEmails: [],
    };

    public offlineMode: boolean = false;

    private waybillDefaultData?: { [field: string]: any };

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService,
                       private toastService: ToastService,
                       private translationService: TranslationService,
                       private apiService: ApiService,
                       private fileService: FileService,
                       private changeDetectorRef: ChangeDetectorRef,
                       private storage: StorageService,
                       private storageService: StorageService,
                       private navService: NavService) {
        this.loading = true;
        this.natureIdsToColors = {};
        this.natureIdsToLabels = {};
        this.dispatchPacks = [];
    }

    public ionViewWillEnter() {
        if (this.navService.popItem?.path
            && this.navService.popItem?.path !== NavPathEnum.DISPATCH_PACKS) {
            return;
        }

        if (!this.packsToTreatListConfig || !this.packsTreatedListConfig) {
            this.loading = true;
            this.unsubscribeLoading();
            const localDispatchId = this.navService.param('localDispatchId');
            const dispatchId = this.navService.param('dispatchId');

            this.loadingSubscription = (this.loadingService.presentLoading()
                .pipe(
                    tap((loader) => {
                        this.loadingElement = loader;
                    }),
                    mergeMap(() => zip(
                            localDispatchId
                                ? this.sqliteService.findOneBy('dispatch', {localId: localDispatchId})
                                : this.sqliteService.findOneBy('dispatch', {id: dispatchId}),
                            localDispatchId
                                ? this.sqliteService.findBy('dispatch_pack', [`localDispatchId = ${localDispatchId}`])
                                : this.sqliteService.findBy('dispatch_pack', [`dispatchId = ${dispatchId}`]),
                            localDispatchId
                                ? this.sqliteService.findOneBy('dispatch_waybill', {localId: localDispatchId})
                                : of(null),
                            this.sqliteService.findAll('nature'),
                            this.translationService.get(null, `Traçabilité`, `Général`),
                            this.storageService.getRight(StorageKeyEnum.DISPATCH_OFFLINE_MODE),
                            this.storageService.getString(StorageKeyEnum.DISPATCH_DEFAULT_WAYBILL),
                            zip(
                                this.storageService.getItem('acheminements.carrierTrackingNumber.displayedCreate'),
                                this.storageService.getItem('acheminements.carrierTrackingNumber.requiredCreate'),

                                this.storageService.getItem('acheminements.pickLocation.displayedCreate'),
                                this.storageService.getItem('acheminements.pickLocation.requiredCreate'),

                                this.storageService.getItem('acheminements.dropLocation.displayedCreate'),
                                this.storageService.getItem('acheminements.dropLocation.requiredCreate'),

                                this.storageService.getItem('acheminements.comment.displayedCreate'),
                                this.storageService.getItem('acheminements.comment.requiredCreate'),

                                this.storageService.getItem('acheminements.emergency.displayedCreate'),
                                this.storageService.getItem('acheminements.emergency.requiredCreate'),

                                this.storageService.getItem('acheminements.receiver.displayedCreate'),
                                this.storageService.getItem('acheminements.receiver.requiredCreate'),
                            ),
                        ).pipe(
                            mergeMap((data) => this.sqliteService
                                .findBy('status', [`category = 'acheminement'`, `state = 'partial'`, `typeId = ${data[0].typeId}`])
                                .pipe(map((partialStatuses) => ([
                                    ...data,
                                    partialStatuses
                                ])))),
                            mergeMap((data) => (
                                data[1].length > 0
                                    ? this.sqliteService
                                        .findBy('dispatch_reference', [`localDispatchPackId IN (${data[1].map(({localId}: DispatchPack) => localId).join(',')})`])
                                        .pipe(map((dispatchReferences) => ([
                                            ...data,
                                            dispatchReferences
                                        ])))
                                    : of([...data, []])
                            ))
                        )
                    ),
                    filter(([dispatch]) => Boolean(dispatch))
                ) as Observable<[Dispatch, Array<DispatchPack>, any, Array<Nature>, Translations, boolean, string, Array<any>, Array<any>, Array<DispatchReference>]>)
                .subscribe(([dispatch, packs, dispatchWaybill, natures, natureTranslations, dispatchOfflineMode, waybillDefaultData, fieldParams, partialStatuses, dispatchReferences]) => {
                    const [
                        displayCarrierTrackingNumber,
                        needsCarrierTrackingNumber,
                        displayPickLocation,
                        needsPickLocation,
                        displayDropLocation,
                        needsDropLocation,
                        displayComment,
                        needsComment,
                        displayEmergency,
                        needsEmergency,
                        displayReceiver,
                        needsReceiver,
                        displayEmails,
                        needsEmails,
                    ] = fieldParams;

                    this.fieldParams = {
                        displayCarrierTrackingNumber: displayCarrierTrackingNumber ? displayCarrierTrackingNumber.split(' ') : [],
                        needsCarrierTrackingNumber: needsCarrierTrackingNumber ? needsCarrierTrackingNumber.split(' ') : [],
                        displayPickLocation: displayPickLocation ? displayPickLocation.split(' ') : [],
                        needsPickLocation: needsPickLocation ? needsPickLocation.split(' ') : [],
                        displayDropLocation: displayDropLocation ? displayDropLocation.split(' ') : [],
                        needsDropLocation: needsDropLocation ? needsDropLocation.split(' ') : [],
                        displayComment: displayComment ? displayComment.split(' ') : [],
                        needsComment: needsComment ? needsComment.split(' ') : [],
                        displayEmergency: displayEmergency ? displayEmergency.split(' ') : [],
                        needsEmergency: needsEmergency? needsEmergency.split(' ') : [],
                        displayReceiver: displayReceiver ? displayReceiver.split(' ') : [],
                        needsReceiver: needsReceiver ? needsReceiver.split(' ') : [],
                        displayEmails: displayEmails ? displayEmails.split(' ') : [],
                        needsEmails: needsEmails ? needsEmails.split(' ') : [],
                    };

                    this.hasWayBillData = Boolean(dispatchWaybill);
                    this.offlineMode = dispatchOfflineMode;
                    this.waybillDefaultData = waybillDefaultData ? JSON.parse(waybillDefaultData) : {};

                    this.dispatchOfflineMode = dispatchOfflineMode;
                    this.typeHasNoPartialStatuses = partialStatuses.length === 0;
                    this.natureIdsToColors = natures.reduce((acc, {id, color}) => ({
                        ...acc,
                        [Number(id)]: color
                    }), {});
                    this.natureIdsToLabels = natures.reduce((acc, {id, label}) => ({
                        ...acc,
                        [Number(id)]: label
                    }), {});
                    this.natureTranslations = natureTranslations;
                    this.dispatchReferences = dispatchReferences;
                    this.dispatchPacks = packs.map((pack) => ({
                        ...pack,
                        treated: !this.fromCreate ? 0 : 1,
                    }));
                    this.dispatch = dispatch;

                    if(!this.fromCreate) {
                        this.refreshListToTreatConfig();
                    }
                    this.refreshListTreatedConfig();
                    this.refreshHeaderPanelConfigFromDispatch();

                    this.unsubscribeLoading();
                    this.loading = false;
                    if (this.footerScannerComponent) {
                        this.footerScannerComponent.fireZebraScan();
                    }
                });
        }
    }

    public ngOnInit(): void {
        this.fromCreate = this.navService.param('fromCreate');
        this.viewMode = this.navService.param('viewMode') || false;
        this.scannerMode = this.fromCreate ? BarcodeScannerModeEnum.WITH_MANUAL : BarcodeScannerModeEnum.INVISIBLE;
    }

    public ionViewWillLeave(): void {
        this.unsubscribeLoading();
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    public takePack(barCode: string): void {
        if(this.fromCreate) {
            this.navService.push(NavPathEnum.DISPATCH_LOGISTIC_UNIT_REFERENCE_ASSOCIATION, {
                logisticUnit: barCode,
                dispatch: this.dispatch,
            });
        } else {
            const selectedIndex = this.dispatchPacks.findIndex(({code}) => (code === barCode));
            if (selectedIndex > -1) {
                const selectedItem = this.dispatchPacks[selectedIndex];
                if (selectedItem.treated) {
                    this.toastService.presentToast(`Vous avez déjà traité ce colis.`);
                }
                else {
                    this.dispatchPacks.splice(selectedIndex, 1);
                    this.dispatchPacks.unshift(selectedItem);
                    selectedItem.treated = 1;
                    this.refreshListToTreatConfig();
                    this.refreshListTreatedConfig();
                    this.refreshHeaderPanelConfigFromDispatch();
                }
            }
            else {
                this.toastService.presentToast(`Ce colis n'est pas dans cet acheminement.`);
            }
        }
    }

    private unsubscribeLoading(): void {
        if (this.loadingSubscription) {
            this.loadingSubscription.unsubscribe();
            this.loadingSubscription = undefined;
        }

        if (this.loadingElement) {
            this.loadingElement.dismiss();
            this.loadingElement = undefined;
        }
    }

    private refreshHeaderPanelConfigFromDispatch(): void {
        zip(
            this.translationService.getRaw(`Demande`, `Acheminements`, `Champs fixes`),
            this.translationService.getRaw(`Demande`, `Acheminements`, `Général`)
        ).subscribe(([fieldsTranslations, generalTranslations]) => {
            const fullTranslations = fieldsTranslations.concat(generalTranslations);
            const dispatchTranslations = TranslationService.CreateTranslationDictionaryFromArray(fullTranslations);
            this.dispatchHeaderConfig = {
                title: this.dispatch.number ? `Demande N°${this.dispatch.number}` : `Type ${this.dispatch.typeLabel}`,
                subtitle: [
                    this.fromCreate && this.fieldParams.displayCarrierTrackingNumber.includes(String(this.dispatch.typeId))
                        ? TranslationService.Translate(dispatchTranslations, 'N° tracking transporteur') + ` : ${this.dispatch.carrierTrackingNumber || ''}`
                        : null,
                    !this.fromCreate || (this.fromCreate && this.fieldParams.displayPickLocation.includes(String(this.dispatch.typeId)))
                        ? TranslationService.Translate(dispatchTranslations, 'Emplacement de prise') + ' : ' + this.dispatch.locationFromLabel || ''
                        : null,
                    this.fromCreate && this.fieldParams.displayDropLocation.includes(String(this.dispatch.typeId))
                            ? TranslationService.Translate(dispatchTranslations, 'Emplacement de dépose') + ' : ' + this.dispatch.locationToLabel || ''
                            : null,
                    this.fromCreate && this.fieldParams.displayComment.includes(String(this.dispatch.typeId))
                            ? `Commentaire : ${this.dispatch.comment || ''}`
                            : null,
                    this.fromCreate && this.fieldParams.displayEmergency.includes(String(this.dispatch.typeId))
                            ? `Urgence : ${this.dispatch.emergency || ''}`
                            : null,
                    this.dispatch.destination ? `Destination : ${this.dispatch.destination || ''}` : null
                ].filter((item) => item) as Array<string>,
                info: this.dispatch.number ? `Type ${this.dispatch.typeLabel}` : undefined,
                transparent: true,
                leftIcon: {
                    color: CardListColorEnum.GREEN,
                    customColor: this.dispatch.color,
                    name: 'stock-transfer.svg'
                }
            };
        });
    }

    private refreshListToTreatConfig(): void {
        const packsToTreat = this.dispatchPacks.filter(({treated, already_treated}) => (!already_treated && !treated));
        const natureTranslation = TranslationService.Translate(this.natureTranslations, 'Nature')
        const natureTranslationCapitalized = natureTranslation.charAt(0).toUpperCase() + natureTranslation.slice(1);

        const plural = packsToTreat.length > 1 ? 's' : '';
        const hasPackToTreat = this.dispatchPacks && this.dispatchPacks.some(({treated}) => !treated);
        this.packsToTreatListConfig = {
            header: {
                title: 'À transférer',
                info: `${packsToTreat.length} objet${plural} à scanner`,
                leftIcon: {
                    name: 'download.svg',
                    color: 'list-green-light'
                },
                rightIconLayout: 'horizontal',
                ...(hasPackToTreat
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
                                action: () => this.transferAll()
                            }
                        ]
                    }
                    : {})
            },
            body: packsToTreat.map((pack) => ({
                ...(this.packToListItemConfig(pack, natureTranslationCapitalized)),
                rightIcon: {
                    color: 'grey' as IconColor,
                    name: 'up.svg',
                    action: () => this.takePack(pack.code)
                }
            })) as Array<ListPanelItemConfig>
        };
    }

    private refreshListTreatedConfig(): void {
        const packsTreated = this.dispatchPacks.filter(({treated, already_treated}) => (already_treated || treated));
        const natureTranslation = TranslationService.Translate(this.natureTranslations, 'Nature')
        const natureTranslationCapitalized = natureTranslation.charAt(0).toUpperCase() + natureTranslation.slice(1);

        this.ableToCreateWaybill = packsTreated.length > 0;

        const plural = packsTreated.length > 1 ? 's' : '';
        this.packsTreatedListConfig = {
            header: {
                title: this.fromCreate ? `Scannée` : 'Transféré',
                info: `${packsTreated.length} unité${plural} logistique${plural} scannée${plural}`,
                leftIcon: {
                    name: 'upload.svg',
                    color: CardListColorEnum.GREEN
                }
            },
            body: packsTreated.map((pack) => ({
                ...(this.packToListItemConfig(pack, natureTranslationCapitalized)),
                ...(
                    !pack.already_treated && !this.fromCreate
                        ? {
                            pressAction: () => {
                                this.navService.push(NavPathEnum.DISPATCH_PACK_CONFIRM, {
                                    pack,
                                    dispatch: this.dispatch,
                                    natureTranslationLabel: natureTranslationCapitalized,
                                    confirmPack: (pack: DispatchPack) => this.confirmPack(pack)
                                })
                            },
                            rightIcon: {
                                name: 'trash.svg',
                                color: 'danger',
                                action: () => this.revertPack(pack.code)
                            }
                        }
                        : (this.fromCreate
                            ? {
                                pressAction: () => {
                                    this.loadingService.presentLoadingWhile({
                                        event: () => this.sqliteService.findOneBy(`dispatch_reference`, {localDispatchPackId: pack.localId})
                                    }).subscribe((reference) => {
                                        this.navService.push(NavPathEnum.DISPATCH_LOGISTIC_UNIT_REFERENCE_ASSOCIATION, {
                                            logisticUnit: pack.code,
                                            dispatch: this.dispatch,
                                            reference : {
                                                packComment: pack?.comment,
                                                packWeight: pack?.weight,
                                                packVolume: pack?.volume,
                                                natureId: pack.natureId,
                                                ...reference
                                            },
                                            edit: true,
                                            viewMode: !Boolean(this.dispatch.draft),
                                        });
                                    });
                                },
                                ...(this.dispatch.draft
                                    ? {
                                        rightIcon: {
                                            name: 'trash.svg',
                                            color: 'danger',
                                            action: () => this.deletePack(pack.code)
                                        }
                                    }
                                    : {})
                            }
                            : {})
                )
            })) as Array<ListPanelItemConfig>
        };
    }

    private packToListItemConfig({code, quantity, natureId, lastLocation, already_treated, localId}: DispatchPack, natureTranslation: string) {
        const dispatchReference: any = this.dispatchReferences.find(({localDispatchPackId}) => localDispatchPackId === localId) || {};

        return {
            infos: {
                code: {
                    label: 'Unité logistique',
                    value: code
                },
                nature: {
                    label: natureTranslation,
                    value: this.natureIdsToLabels[Number(natureId)]
                },
                ...(dispatchReference.reference ? {
                    reference: {
                        label: `Référence`,
                        value: dispatchReference.reference
                    }
                }: {}),
                quantity: {
                    label: 'Quantité',
                    value: `${dispatchReference.quantity || quantity}`
                },
                ...(!dispatchReference.reference ? {
                    lastLocation: {
                        label: 'Dernier emplacement',
                        value: lastLocation
                    },
                } : {}),
            },
            color: this.natureIdsToColors[Number(natureId)],
        }
    }

    private revertPack(barCode: string): void {
        const selectedIndex = this.dispatchPacks.findIndex(({code}) => (code === barCode));
        if (selectedIndex > -1
            && this.dispatchPacks[selectedIndex].treated) {
            const dispatchPack = this.dispatchPacks[selectedIndex];
            if (this.fromCreate) {
                this.loadingService.presentLoadingWhile({
                    event: () => zip(
                        this.sqliteService.deleteBy(`dispatch_pack`, [`localId = ${dispatchPack.localId}`]),
                        this.sqliteService.deleteBy(`dispatch_reference`, [`localDispatchPackId = ${dispatchPack.localId}`]),
                    )
                }).subscribe(() => {
                    this.dispatchPacks.splice(selectedIndex, 1);
                    this.refreshListTreatedConfig();
                    this.refreshHeaderPanelConfigFromDispatch();
                });
            } else {
                dispatchPack.treated = 0;

                this.refreshListToTreatConfig();
                this.refreshListTreatedConfig();
                this.refreshHeaderPanelConfigFromDispatch();
            }
        }
    }

    private deletePack(barCode: string): void {
        const selectedIndex = this.dispatchPacks.findIndex(({code}) => (code === barCode));
        if (selectedIndex > -1
            && this.dispatchPacks[selectedIndex].treated) {
            const dispatchPack = this.dispatchPacks[selectedIndex];
            if (this.fromCreate) {
                this.loadingService.presentLoadingWhile({
                    event: () => zip(
                        this.sqliteService.deleteBy(`dispatch_pack`, [`localId = ${dispatchPack.localId}`]),
                        this.sqliteService.deleteBy(`dispatch_reference`, [`localDispatchPackId = ${dispatchPack.localId}`]),
                    )
                }).subscribe(() => {
                    this.dispatchPacks.splice(selectedIndex, 1);
                    this.refreshListTreatedConfig();
                    this.refreshHeaderPanelConfigFromDispatch();
                });
            } else {
                dispatchPack.treated = 0;

                this.refreshListToTreatConfig();
                this.refreshListTreatedConfig();
                this.refreshHeaderPanelConfigFromDispatch();
            }
        }
    }

    public validate(): void {
        if (this.fromCreate) {
            if(this.dispatchPacks.filter(({treated}) => treated).length === 0) {
                this.toastService.presentToast(`Vous devez scanner au moins une unité logistique pour continuer.`)
            } else {
                this.loadingService.presentLoadingWhile({
                    event: () => of(undefined)
                        .pipe(
                            mergeMap(() => this.updateCurrentDispatchStatus()),
                            mergeMap(() => this.tryValidateDispatch()),
                            mergeMap(({local, success, msg}) => (
                                local || !success
                                    ? of({local, success, msg})
                                    : this.treatApiSuccess().pipe(map(() => ({local, success, msg})))
                            )),
                        )
                }).subscribe(({success, msg, local}) => {
                    if (!success) {
                        this.toastService.presentToast(msg);
                    } else if (local) {
                        this.navService.pop();
                    }
                });
            }
        } else {
            const partialDispatch = this.dispatchPacks.filter(({
               treated,
               already_treated
            }) => (treated != 1 && already_treated != 1)).length > 0
            if (!partialDispatch || !this.typeHasNoPartialStatuses) {
                this.navService.push(NavPathEnum.DISPATCH_VALIDATE, {
                    dispatchId: this.dispatch.id,
                    dispatchPacks: this.dispatchPacks
                });
            } else {
                this.toastService.presentToast("Vous ne pouvez pas valider d'acheminement partiel.")
            }
        }
    }

    private confirmPack({id: packIdToConfirm, natureId, quantity, photo1, photo2}: DispatchPack): void {
        const packIndexToConfirm = this.dispatchPacks.findIndex(({id}) => (id === packIdToConfirm));
        if (packIndexToConfirm > -1) {
            this.dispatchPacks[packIndexToConfirm].natureId = Number(natureId);
            this.dispatchPacks[packIndexToConfirm].quantity = Number(quantity);
            this.dispatchPacks[packIndexToConfirm].photo1 = photo1;
            this.dispatchPacks[packIndexToConfirm].photo2 = photo2;
            this.sqliteService.update('dispatch_pack', [{
                values: {
                    natureId: this.dispatchPacks[packIndexToConfirm].natureId,
                    quantity: this.dispatchPacks[packIndexToConfirm].quantity,
                    photo1: this.dispatchPacks[packIndexToConfirm].photo1,
                    photo2: this.dispatchPacks[packIndexToConfirm].photo2,
                },
                where: [`localId = ${this.dispatchPacks[packIndexToConfirm].localId}`]
            }])
            this.refreshListTreatedConfig();
        }
    }

    private transferAll(): void {
        this.dispatchPacks
            .filter(({treated}) => !treated)
            .forEach(({code}) => {
                this.takePack(code);
            });
    }

    public goToWayBill() {
        if (!this.hasWayBillData) {
            this.loadingService.presentLoadingWhile({
                event: () => this.getDefaultDispatchWaybillData()
            }).subscribe((apiWayBill) => {
                const fusedData = {
                    ...apiWayBill.data,
                    ...this.wayBillData
                };
                this.navService.push(NavPathEnum.DISPATCH_WAYBILL, {
                    dispatchLocalId: this.dispatch.localId,
                    dispatchPacks: this.dispatchPacks,
                    data: fusedData,
                    afterValidate: (data: any) => {
                        this.wayBillData = data;
                        this.hasWayBillData = true;
                        this.changeDetectorRef.detectChanges();
                    }
                });
            });
        } else {
            this.loadingService.presentLoadingWhile({
                event: () => this.sqliteService.deleteBy('dispatch_waybill', [`localId = ${this.dispatch.localId}`])
            }).subscribe(() => {
                this.hasWayBillData = false;
            });
        }
    }

    private getDefaultDispatchWaybillData(): Observable<{ [field: string]: any }> {
        if (this.offlineMode) {
            let data;
            if (this.waybillDefaultData) {
                data = {
                    carrier: this.waybillDefaultData.carrier,
                    consignor: this.waybillDefaultData.consignor,
                    consignorEmail: this.waybillDefaultData.consignorEmail,
                    consignorUsername: this.waybillDefaultData.consignorUsername,
                    dispatchDate: this.waybillDefaultData.dispatchDate,
                    locationFrom: this.waybillDefaultData.locationFrom,
                    locationTo: this.waybillDefaultData.locationTo,
                    notes: this.waybillDefaultData.notes,
                    receiver: this.waybillDefaultData.receiver,
                    receiverEmail: this.waybillDefaultData.receiverEmail,
                    receiverUsername: this.waybillDefaultData.receiverUsername,
                };
            } else {
                data = {};
            }

            return of({
                success: true,
                data,
            });
        } else {
            return this.apiService.requestApi(ApiService.GET_WAYBILL_DATA, {
                pathParams: {
                    dispatch: this.dispatch.id as number
                }
            })
        }
    }

    private makeApiReferencesParam(): Observable<any> {
        return this.sqliteService
            .findBy(`dispatch_reference`, [
                `localDispatchPackId IN (${this.dispatchPacks.map(({localId}: DispatchPack) => localId).join(',')})`
            ])
            .pipe(
                map((references) => references.map(({localDispatchPackId, ...reference}) => {
                    const {code: logisticUnit, natureId, comment: packComment, weight: packWeight, volume: packVolume} = this.dispatchPacks.find(({localId}) => localId === localDispatchPackId) as DispatchPack;

                    const photos = JSON.parse(reference.photos);
                    const volume = `${reference.volume}`;
                    delete reference.photos;
                    return {
                        ...reference,
                        volume,
                        natureId,
                        packComment,
                        packWeight,
                        packVolume,
                        logisticUnit,
                        ...(
                            photos && photos.length > 0
                                ? photos.reduce((acc: { [name: string]: File}, photoBase64: string, index: number) => {
                                    const name = `photo_${index + 1}`;
                                    return ({
                                        ...acc,
                                        [name]: photoBase64,
                                    })
                                }, {})
                                : {}
                        )
                    };
                }))
            );
    }

    private updateCurrentDispatchStatus(): Observable<any> {
        return this.sqliteService
            .findBy('status', [
                `state = 'notTreated'`,
                `category = 'acheminement'`,
                `typeId = ${this.dispatch.typeId}`
            ], {displayOrder: 'ASC'})
            .pipe(
                mergeMap(([notTreatedStatus]: Array<Status>) => {
                    return this.sqliteService.update(`dispatch`, [{
                        values: {
                            draft: 0,
                            statusId: notTreatedStatus?.id || this.dispatch.statusId,
                            statusLabel: notTreatedStatus?.label || this.dispatch.statusLabel,
                            groupedSignatureStatusColor: notTreatedStatus?.groupedSignatureColor || this.dispatch.groupedSignatureStatusColor,
                            validatedAt: moment().format(),
                        },
                        where: [`localId = ${this.dispatch.localId}`]
                    }])
                }),
            );
    }

    private tryValidateDispatch() {
        return this.dispatchOfflineMode
            ? of({success: true, msg: `L'acheminement a bien été enregistré sur le nomade`, local: true})
            : this.makeApiReferencesParam().pipe(
                mergeMap((references) => {
                    return this.apiService.requestApi(ApiService.DISPATCH_VALIDATE, {
                        params: {
                            references,
                            dispatch: this.dispatch.id
                        }
                    })
                })
            );
    }

    private treatApiSuccess() {
        // only in online mode
        return zip(
            this.sqliteService.deleteBy(`dispatch_reference`),
            this.hasWayBillData
                ? this.apiService.requestApi(ApiService.DISPATCH_WAYBILL, {
                    pathParams: {dispatch: this.dispatch.id as number},
                    params: this.wayBillData
                })
                : of(null),
            this.storage.getString(StorageKeyEnum.URL_SERVER)
        )
            .pipe(
                mergeMap((res) => this.navService.pop({path: NavPathEnum.DISPATCH_REQUEST_MENU}).pipe(map(() => res))),
                tap(([ignoredQueryResponse, waybillResponse, url]) => {
                    if (this.hasWayBillData && waybillResponse.filePath) {
                        Browser.open({url: url + waybillResponse.filePath})
                    }
                })
            );
    }
}
