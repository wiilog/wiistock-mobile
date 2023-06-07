import {Component, OnInit, ViewChild} from '@angular/core';
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

    public readonly listBoldValues = ['code', 'reference', 'quantity'];

    private dispatch: Dispatch;
    public fromCreate: boolean = false;
    public viewMode: boolean = false;
    public ableToCreateWaybill: boolean = false;
    private dispatchPacks: Array<DispatchPack>;

    private typeHasNoPartialStatuses: boolean;

    private natureIdsToColors: {[natureId: number]: string};
    private natureIdsToLabels: {[natureId: number]: string};
    private natureTranslations: Translations;

    private loadingSubscription?: Subscription;
    private loadingElement?: HTMLIonLoadingElement;

    private fieldParams: {
        displayCarrierTrackingNumber: boolean,
        needsCarrierTrackingNumber: boolean,
        displayPickLocation: boolean,
        needsPickLocation: boolean,
        displayDropLocation: boolean,
        needsDropLocation: boolean,
        displayComment: boolean,
        needsComment: boolean,
        displayEmergency: boolean,
        needsEmergency: boolean,
        displayReceiver: boolean,
        needsReceiver: boolean,
    } = {
        displayCarrierTrackingNumber: false,
        needsCarrierTrackingNumber: false,
        displayPickLocation: false,
        needsPickLocation: false,
        displayDropLocation: false,
        needsDropLocation: false,
        displayComment: false,
        needsComment: false,
        displayEmergency: false,
        needsEmergency: false,
        displayReceiver: false,
        needsReceiver: false,
    };

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService,
                       private toastService: ToastService,
                       private translationService: TranslationService,
                       private apiService: ApiService,
                       private fileService: FileService,
                       private storage: StorageService,
                       private storageService: StorageService,
                       private navService: NavService) {
        this.loading = true;
        this.natureIdsToColors = {};
        this.natureIdsToLabels = {};
        this.dispatchPacks = [];
    }

    public ionViewWillEnter() {
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
                            this.sqliteService.findAll('nature'),
                            this.translationService.get(null, `Traçabilité`, `Général`),
                            this.storageService.getRight(StorageKeyEnum.DISPATCH_OFFLINE_MODE),
                            zip(
                                this.storageService.getNumber('acheminements.carrierTrackingNumber.displayedCreate'),
                                this.storageService.getNumber('acheminements.carrierTrackingNumber.requiredCreate'),

                                this.storageService.getNumber('acheminements.pickLocation.displayedCreate'),
                                this.storageService.getNumber('acheminements.pickLocation.requiredCreate'),

                                this.storageService.getNumber('acheminements.dropLocation.displayedCreate'),
                                this.storageService.getNumber('acheminements.dropLocation.requiredCreate'),

                                this.storageService.getNumber('acheminements.comment.displayedCreate'),
                                this.storageService.getNumber('acheminements.comment.requiredCreate'),

                                this.storageService.getNumber('acheminements.emergency.displayedCreate'),
                                this.storageService.getNumber('acheminements.emergency.requiredCreate'),

                                this.storageService.getNumber('acheminements.receiver.displayedCreate'),
                                this.storageService.getNumber('acheminements.receiver.requiredCreate'),
                            ),
                        ).pipe(
                            mergeMap((data) => this.sqliteService
                                .findBy('status', [`category = 'acheminement'`, `state = 'partial'`, `typeId = ${data[0].typeId}`])
                                .pipe(map((partialStatuses) => ([
                                    ...data,
                                    partialStatuses
                                ]))))
                        )
                    ),
                    filter(([dispatch]) => Boolean(dispatch))
                ) as Observable<[Dispatch, Array<DispatchPack>, Array<Nature>, Translations, boolean, Array<any>, Array<any>]>)
                .subscribe(([dispatch, packs, natures, natureTranslations, dispatchOfflineMode, fieldParams, partialStatuses]) => {
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
                    ] = fieldParams;
                    this.fieldParams = {
                        displayCarrierTrackingNumber: Boolean(displayCarrierTrackingNumber),
                        needsCarrierTrackingNumber: Boolean(needsCarrierTrackingNumber),
                        displayPickLocation: Boolean(displayPickLocation),
                        needsPickLocation: Boolean(needsPickLocation),
                        displayDropLocation: Boolean(displayDropLocation),
                        needsDropLocation: Boolean(needsDropLocation),
                        displayComment: Boolean(displayComment),
                        needsComment: Boolean(needsComment),
                        displayEmergency: Boolean(displayEmergency),
                        needsEmergency: Boolean(needsEmergency),
                        displayReceiver: Boolean(displayReceiver),
                        needsReceiver: Boolean(needsReceiver),
                    };

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
                title: `Demande N°${this.dispatch.number}`,
                subtitle: [
                    this.fromCreate && this.fieldParams.displayCarrierTrackingNumber
                        ? TranslationService.Translate(dispatchTranslations, 'N° tracking transporteur') + ` : ${this.dispatch.carrierTrackingNumber || ''}`
                        : null,
                    !this.fromCreate || (this.fromCreate && this.fieldParams.displayPickLocation)
                        ? TranslationService.Translate(dispatchTranslations, 'Emplacement de prise') + ' : ' + this.dispatch.locationFromLabel || ''
                        : null,
                    this.fromCreate && this.fieldParams.displayDropLocation
                            ? TranslationService.Translate(dispatchTranslations, 'Emplacement de dépose') + ' : ' + this.dispatch.locationToLabel || ''
                            : null,
                    this.fromCreate && this.fieldParams.displayComment
                            ? `Commentaire : ${this.dispatch.comment || ''}`
                            : null,
                    this.fromCreate && this.fieldParams.displayEmergency
                            ? `Urgence : ${this.dispatch.emergency || ''}`
                            : null,
                    this.dispatch.destination ? `Destination : ${this.dispatch.destination || ''}` : null
                ].filter((item) => item) as Array<string>,
                info: `Type ${this.dispatch.typeLabel}`,
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
                                        event: () => this.sqliteService.findOneBy(`dispatch_reference`, {reference: pack.reference})
                                    }).subscribe((reference) => {
                                        this.navService.push(NavPathEnum.DISPATCH_LOGISTIC_UNIT_REFERENCE_ASSOCIATION, {
                                            logisticUnit: pack.code,
                                            dispatch: this.dispatch,
                                            reference,
                                            edit: true,
                                            viewMode: this.viewMode
                                        });
                                    });
                                }
                            }
                            : {})
                )
            })) as Array<ListPanelItemConfig>
        };
    }

    private packToListItemConfig({code, quantity, natureId, lastLocation, already_treated, reference}: DispatchPack, natureTranslation: string) {
        return {
            infos: {
                code: {
                    label: 'Unité logistique',
                    value: code
                },
                ...(reference ? {
                    reference: {
                        label: `Référence`,
                        value: reference
                    }
                }: {}),
                quantity: {
                    label: 'Quantité',
                    value: `${quantity}`
                },
                ...(!reference ? {
                    nature: {
                        label: natureTranslation,
                        value: this.natureIdsToLabels[Number(natureId)]
                    },
                } : {}),
                ...(!reference ? {
                    lastLocation: {
                        label: 'Dernier emplacement',
                        value: lastLocation
                    },
                } : {}),
            },
            color: this.natureIdsToColors[Number(natureId)],
            disabled: Boolean(already_treated)
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
                        this.sqliteService.deleteBy(`dispatch_pack`, [`id = ${dispatchPack.id}`]),
                        this.sqliteService.deleteBy(`dispatch_reference`, [`reference = '${dispatchPack.reference}'`]),
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
                                local && !success
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
                    dispatchPacks: this.dispatchPacks,
                    afterValidate: () => {
                        this.navService.pop();
                    }
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
        if(!this.hasWayBillData) {
            this.loadingService.presentLoadingWhile({
                event: () => {
                    return this.apiService.requestApi(ApiService.GET_WAYBILL_DATA, {
                        pathParams: {
                            dispatch: this.dispatch.id as number
                        }
                    })
                }
            }).subscribe((apiWayBill) => {
                const fusedData = {
                    ...apiWayBill.data,
                    ...this.wayBillData
                };
                this.navService.push(NavPathEnum.DISPATCH_WAYBILL, {
                    dispatchId: this.dispatch.id,
                    dispatchPacks: this.dispatchPacks,
                    data: fusedData,
                    afterValidate: (data: any) => {
                        this.wayBillData = data;
                        this.hasWayBillData = true;
                    }
                });
            })
        } else {
            this.hasWayBillData = false;
        }
    }

    private makeApiReferencesParam(): Observable<any> {
        return this.sqliteService
            .findBy(`dispatch_reference`, [
                `reference IN (${this.dispatchPacks.map((dispatchPack: DispatchPack) => `'${dispatchPack.reference}'`).join(',')})`
            ])
            .pipe(
                mergeMap((references) => of(references.map((reference) => {
                    const photos = JSON.parse(reference.photos);
                    const volume = `${reference.volume}`;
                    delete reference.photos;
                    return {
                        ...reference,
                        ...{volume},
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
                })))
            );
    }

    private updateCurrentDispatchStatus(): Observable<void> {
        return this.sqliteService
            .findBy('status', [
                `state = 'notTreated'`,
                `category = 'acheminement'`,
                `typeId = ${this.dispatch.typeId}`
            ], {displayOrder: 'ASC'})
            .pipe(
                mergeMap(([notTreatedStatus]: Array<Status>) => this.sqliteService.update(`dispatch`, [{
                    values: {
                        draft: 0,
                        statusId: notTreatedStatus?.id || this.dispatch.statusId,
                        statusLabel: notTreatedStatus?.label || this.dispatch.statusLabel
                    },
                    where: [`localId = ${this.dispatch.localId}`]
                }]))
            );
    }

    private tryValidateDispatch() {
        return this.dispatchOfflineMode
            ? of({success: true, msg: `L'acheminement a bien été enregistrer sur le nomade`, local: true})
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
                mergeMap((res) => this.navService.pop({path: NavPathEnum.MAIN_MENU}).pipe(map(() => res))),
                tap(([ignoredQueryResponse, waybillResponse, url]) => {
                    if (this.hasWayBillData && waybillResponse.filePath) {
                        Browser.open({url: url + waybillResponse.filePath})
                    }
                })
            );
    }
}
