import {ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {BarcodeScannerComponent} from '@common/components/barcode-scanner/barcode-scanner.component';
import {ApiService} from '@app/services/api.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {ToastService} from '@app/services/toast.service';
import {LoadingService} from '@app/services/loading.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {StorageService} from '@app/services/storage/storage.service';
import {ActivatedRoute} from '@angular/router';
import {NavService} from '@app/services/nav/nav.service';
import {TranslationService} from '@app/services/translations.service';
import {AlertService} from '@app/services/alert.service';
import {NetworkService} from '@app/services/network.service';
import {BarcodeScannerModeEnum} from '@common/components/barcode-scanner/barcode-scanner-mode.enum';
import {IconConfig} from '@common/components/panel/model/icon-config';
import {FormPanelComponent} from '@common/components/panel/form-panel/form-panel.component';
import {FormPanelParam} from '@common/directives/form-panel/form-panel-param';
import {
    FormPanelSelectComponent
} from '@common/components/panel/form-panel/form-panel-select/form-panel-select.component';
import {SelectItemTypeEnum} from '@common/components/select-item/select-item-type.enum';
import {FormPanelInputComponent} from '@common/components/panel/form-panel/form-panel-input/form-panel-input.component';
import {
    FormPanelCalendarComponent
} from '@common/components/panel/form-panel/form-panel-calendar/form-panel-calendar.component';
import {FormPanelCalendarMode} from '@common/components/panel/form-panel/form-panel-calendar/form-panel-calendar-mode';
import {
    FormPanelTextareaComponent
} from '@common/components/panel/form-panel/form-panel-textarea/form-panel-textarea.component';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";
import {mergeMap, Observable, of, tap} from "rxjs";
import {RfidManagerService} from "@app/services/rfid-manager.service";
import {StorageKeyEnum} from "@app/services/storage/storage-key.enum";
import {map} from "rxjs/operators";
import {BarcodeScannerManagerService} from "@app/services/barcode-scanner-manager.service";


@Component({
    selector: 'wii-prise',
    templateUrl: './article-creation.page.html',
    styleUrls: ['./article-creation.page.scss'],
})
export class ArticleCreationPage implements ViewWillEnter, ViewWillLeave {

    private static readonly SCANNER_RFID_DELAY: number = 10000; // 10 seconds

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public bodyConfig: Array<FormPanelParam>;

    public scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.ONLY_MANUAL;
    public loading: boolean = false;
    public rfidTag: string = '';
    public headerConfig?: {
        leftIcon: IconConfig;
        rightIcon?: IconConfig;
        title: string;
        subtitle?: string;
    };

    private rfidPrefix?: string;

    public PREFIXES_TO_FIELDS: {[prefix: string]: string} = {
        CPO: 'commandNumber',
        PNR: 'reference',
        SHQ: 'quantity',
        PSN: 'deliveryLine',
        DMF: 'manufacturingDate',
        CNT: 'country',
        VNB: 'batch',
        EXP: 'expiryDate',
        CUR: 'productionDate',
        BIN: 'destination',
    };

    public creation = false;

    public reference: number;
    public supplier: number;

    public defaultValues: {
        location: string;
        type: string;
        reference: string;
        label: string;
        quantity: string;
        supplier: string;
        supplierReference: string;
    };

    private scanLaunchedWithButton?: boolean;

    public constructor(private networkService: NetworkService,
                       private apiService: ApiService,
                       private sqliteService: SqliteService,
                       private alertService: AlertService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private changeDetectorRef: ChangeDetectorRef,
                       private localDataManager: LocalDataManagerService,
                       private activatedRoute: ActivatedRoute,
                       private storageService: StorageService,
                       private translationService: TranslationService,
                       private navService: NavService,
                       private changeDetector: ChangeDetectorRef,
                       private rfidManager: RfidManagerService,
                       private barcodeScannerManager: BarcodeScannerManagerService) {
    }

    public ionViewWillEnter(): void {
        this.creation = false;
        this.bodyConfig = [];
        this.loading = true;
        this.scannerMode = BarcodeScannerModeEnum.ONLY_MANUAL;
        this.loadingService.presentLoadingWhile({
            event: () => {
                return this.retrieveDefaultValues().pipe(
                    mergeMap(() => this.storageService.getString(StorageKeyEnum.PARAMETER_RFID_PREFIX).pipe(
                        tap((rfidPrefix) => {
                            this.rfidPrefix = rfidPrefix || '';
                        })
                    )),
                    mergeMap(() => this.defaultValues.location
                        ? this.rfidManager.ensureScannerConnection()
                        : of(undefined)),
                )
            }
        }).subscribe((rfidResult) => {
            if (this.defaultValues.location) {
                if (rfidResult) {
                    this.initRfidEvents();
                }

                this.headerConfig = {
                    leftIcon: {
                        name: 'new-article-RFID.svg'
                    },
                    title: `Balayer étiquette RFID`,
                    subtitle: `Emplacement : ${this.defaultValues.location}`
                }
                this.loading = false;
            } else {
                this.toastService.presentToast('Aucun emplacement par défaut paramétré.');
            }
        })
    }

    public ionViewWillLeave(): void {
        this.disconnectRFIDScanner();
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    private initRfidEvents(): void {
        this.rfidManager.launchEventListeners();

        this.rfidManager.tagsRead$
            .pipe(
                map(({tags, ...remaining}) => ({
                    ...remaining,
                    tags: (tags || []).filter((tag) => tag.startsWith(this.rfidPrefix || ''))
                }))
            )
            .subscribe(({tags}) => {
                const [firstTag] = tags || [];
                if (firstTag) {
                    this.onRFIDTagScanned(firstTag);
                }
            })
    }

    public initForm(): void {
        const values = this.formPanelComponent ? this.formPanelComponent.values : null;

        this.bodyConfig = [
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Type',
                    name: 'type',
                    value: values ? values.type : (this.defaultValues.type || null),
                    inputConfig: {
                        searchType: SelectItemTypeEnum.TYPE,
                        requestParams: [
                            `category = 'article'`,
                        ],
                    },
                }
            },
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Référence',
                    name: 'reference',
                    value: values ? values.reference : (this.defaultValues.reference || null),
                    inputConfig: {
                        searchType: SelectItemTypeEnum.REFERENCE_ARTICLE,
                        onChange: (reference) => {
                            this.reference = reference;
                            if (this.supplier) {
                                this.importSupplierReferences().subscribe(() => {
                                    this.initForm();
                                });
                            }
                        }
                    },
                }
            },
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Fournisseur',
                    name: 'supplier',
                    value: values ? values.supplier : (this.defaultValues.supplier || null),
                    inputConfig: {
                        searchType: SelectItemTypeEnum.SUPPLIER,
                        onChange: (supplier) => {
                            this.supplier = supplier;
                            if (this.reference) {
                                this.importSupplierReferences().subscribe(() => {
                                    this.initForm();
                                })
                            }
                        }
                    },
                }
            },
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Référence fournisseur',
                    name: 'supplier_reference',
                    value: values ? values.supplier_reference : (this.defaultValues.supplierReference || null),
                    inputConfig: {
                        searchType: SelectItemTypeEnum.SUPPLIER_REFERENCE,
                        disabled: !this.supplier || !this.reference
                    },
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Libellé',
                    name: 'label',
                    value: values ? values.label : (this.defaultValues.label || null),
                    inputConfig: {
                        type: 'text'
                    },
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Quantité',
                    name: 'quantity',
                    value: values ? values.quantity : (this.defaultValues.quantity || null),
                    inputConfig: {
                        type: 'number'
                    },
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Prix unitaire',
                    name: 'price',
                    value: values ? values.quantity : (this.defaultValues.quantity || null),
                    inputConfig: {
                        type: 'number'
                    },
                }
            },
            {
                item: FormPanelCalendarComponent,
                config: {
                    label: 'Date de péremption',
                    name: 'expiryDate',
                    value: values ? values.expiryDate : null,
                    inputConfig: {
                        mode: FormPanelCalendarMode.DATE
                    },
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Numéro de lot',
                    value: values ? values.batch : null,
                    name: 'batch',
                    inputConfig: {
                        type: 'text',
                    },
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Zone de destination',
                    value: values ? values.destination : null,
                    name: 'destination',
                    inputConfig: {
                        type: 'text',
                    },
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Numéro de commande',
                    value: values ? values.commandNumber : null,
                    name: 'commandNumber',
                    inputConfig: {
                        type: 'text',
                    },
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Ligne bon de livraison',
                    value: values ? values.deliveryLine : null,
                    name: 'deliveryLine',
                    inputConfig: {
                        type: 'text',
                    },
                }
            },
            {
                item: FormPanelCalendarComponent,
                config: {
                    label: 'Date de fabrication',
                    value: values ? values.manufacturingDate : null,
                    name: 'manufacturingDate',
                    inputConfig: {
                        mode: FormPanelCalendarMode.DATE,
                    },
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Pays d\'origine',
                    value: values ? values.country : null,
                    name: 'country',
                    inputConfig: {
                        type: 'text',
                    },
                }
            },
            {
                item: FormPanelCalendarComponent,
                config: {
                    label: 'Date de production',
                    value: values ? values.productionDate : null,
                    name: 'productionDate',
                    inputConfig: {
                        mode: FormPanelCalendarMode.DATE,
                    },
                }
            },
            {
                item: FormPanelTextareaComponent,
                config: {
                    label: 'Commentaire',
                    value: values ? values.comment : null,
                    name: 'comment',
                    inputConfig: {
                        type: 'text',
                        maxLength: '512',
                    },
                }
            },
        ]
    }

    public importSupplierReferences(loader: boolean = true) {
        const requestApi = () => {
            return this.apiService.requestApi(ApiService.GET_SUPPLIER_REF_BY_REF_AND_SUPPLIER, {
                pathParams: {
                    ref: this.reference,
                    supplier: this.supplier
                }
            }).pipe(
                mergeMap(({supplierReferences}) => this.sqliteService.importSupplierReferences(supplierReferences)),
            );
        };

        if (loader) {
            return this.loadingService.presentLoadingWhile({
                event: () => requestApi()
            });
        }
        else {
            return requestApi();
        }
    }

    public onRFIDButtonClicked(): void {
        if (!this.scanLaunchedWithButton) {
            this.scanLaunchedWithButton = true;
            this.rfidManager.startScan();

            setTimeout(() => {
                if (this.scanLaunchedWithButton) {
                    this.rfidManager.stopScan(false);
                    this.scanLaunchedWithButton = false;
                }
            }, ArticleCreationPage.SCANNER_RFID_DELAY);
        }
    }

    public onRFIDTagScanned(tag: string): void {
        if (!this.loading && !this.creation) {
            this.rfidManager.stopScan();
            this.loading = true;
            this.scanLaunchedWithButton = false;
            this.loadingService.presentLoadingWhile({
                event: () => {
                    return this.apiService
                        .requestApi(ApiService.GET_ARTICLE_BY_RFID_TAG, {
                            pathParams: {rfid: tag},
                        })
                }
            }).subscribe(({article}) => {
                if (article) {
                    this.toastService.presentToast('Article existant.');
                    this.creation = false;
                    this.bodyConfig = [];
                } else if (this.defaultValues.location) {
                    this.creation = true;
                    this.rfidTag = tag;
                    this.scannerMode = BarcodeScannerModeEnum.INVISIBLE;

                    if (this.headerConfig) {
                        this.headerConfig.title = `CODE RFID : ${this.rfidTag}`;
                        this.headerConfig.rightIcon = {
                            name: 'scan-photo.svg',
                            color: 'primary',
                            action: () => {
                                if (this.footerScannerComponent) {
                                    this.footerScannerComponent.scan();
                                }
                            }
                        };
                    }
                    this.initForm();
                    this.disconnectRFIDScanner();
                    this.changeDetector.detectChanges();
                } else {
                    this.toastService.presentToast('Aucun emplacement par défaut paramétré.');
                }
                this.loading = false;
            });
        }
    }

    public onDatamatrixScanned(value: string): void {
        if (this.creation) {
            const formattedValue = value.replace(/~~/g, '~');
            const matrixParts = formattedValue.split('~');
            const values = matrixParts
                .filter((part) => part)
                .reduce((accumulator: { [field: string]: string }, part) => {
                    const associatedKey: string | undefined = Object.keys(this.PREFIXES_TO_FIELDS).find((key) => part.startsWith(key));
                    if (associatedKey) {
                        const associatedField: string | undefined = this.PREFIXES_TO_FIELDS[associatedKey];
                        if (associatedKey) {
                            accumulator[associatedField] = part.substring(associatedKey.length);
                        }
                    }
                    return accumulator;
                }, {});
            this.validate(values);
        }
    }

    private disconnectRFIDScanner(): void {
        this.rfidManager.removeEventListeners();
    }

    public validate(matrixValues?: {[field: string]: string}) {
        const params: {[field: string]: string|boolean|number} = {
            rfidTag: this.rfidTag,
            location: this.defaultValues.location,
            ...(matrixValues ? {fromMatrix: true} : {}),
            ...this.formPanelComponent.values,
            ...(matrixValues || {})
        };

        if (!params.fromMatrix
            && (!params.type || !params.reference || !params.supplier
            || !params.supplier_reference || !params.label || !params.quantity)) {
            this.toastService
                .presentToast('Veuillez scanner un code-barre ou saisir un type, une référence, ' +
                    'un fournisseur, une référence fournisseur, un label et une quantité pour l\'article.')
        } else {
            this.loadingService.presentLoadingWhile({
                event: () => {
                    return this.apiService.requestApi(ApiService.CREATE_ARTICLE, {
                        params
                    })
                }
            }).subscribe((response) => {
                this.toastService.presentToast(response.message).subscribe(() => {
                    if (response.success) {
                        this.navService.pop();
                    }
                })
            })
        }
    }

    public onScan2DTouchstart(): void {
        this.barcodeScannerManager.startDatawedgeScanning();
    }

    public onScan2DTouchend(): void {
        this.barcodeScannerManager.stopDatawedgeScanning();
    }

    private retrieveDefaultValues(): Observable<void> {
        return this.storageService.getString(StorageKeyEnum.ARTICLE_CREATION_DEFAULT_VALUES)
            .pipe(
                mergeMap((defaultValuesCached) => {
                    const defaultValuesJson = defaultValuesCached && JSON.parse(defaultValuesCached);
                    if (defaultValuesJson) {
                        return of({defaultValues: defaultValuesJson});
                    }
                    else {
                        return this.apiService.requestApi(ApiService.DEFAULT_ARTICLE_VALUES);
                    }
                }),
                mergeMap(({defaultValues}) => defaultValues
                    ? this.storageService.setItem(StorageKeyEnum.ARTICLE_CREATION_DEFAULT_VALUES, JSON.stringify(defaultValues)).pipe(map(() => ({defaultValues})))
                    : of({defaultValues})),
                mergeMap(({defaultValues}) => {
                    this.defaultValues = defaultValues;

                    if (this.defaultValues.supplier && this.defaultValues.reference) {
                        this.reference = Number(this.defaultValues.reference);
                        this.supplier = Number(this.defaultValues.supplier);
                        return this.importSupplierReferences(false);
                    }
                    else {
                        return of(undefined);
                    }
                }),
                map(() => undefined)
            );
    }
}
