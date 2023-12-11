import {Component, ViewChild} from '@angular/core';
import {BarcodeScannerComponent} from '@common/components/barcode-scanner/barcode-scanner.component';
import {ApiService} from '@app/services/api.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {ToastService} from '@app/services/toast.service';
import {LoadingService} from '@app/services/loading.service';
import {StorageService} from '@app/services/storage/storage.service';
import {NavService} from '@app/services/nav/nav.service';
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
import {mergeMap, Observable, of} from "rxjs";
import {StorageKeyEnum} from "@app/services/storage/storage-key.enum";
import {map} from "rxjs/operators";
import {BarcodeScannerManagerService} from "@app/services/barcode-scanner-manager.service";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";
import {Emplacement} from "@entities/emplacement";


@Component({
    selector: 'wii-article-creation-form',
    templateUrl: './form.page.html',
    styleUrls: ['./form.page.scss'],
})
export class FormPage implements ViewWillEnter, ViewWillLeave {

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public bodyConfig: Array<FormPanelParam>;

    public readonly scannerMode = BarcodeScannerModeEnum.INVISIBLE;
    public loading: boolean = false;
    public rfidTag: string = '';

    public headerConfig?: {
        leftIcon: IconConfig;
        rightIcon?: IconConfig;
        title: string;
    };

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

    public reference: number;
    public supplier: number;

    public defaultValues: {
        destination: number;
        type: string;
        reference: string;
        label: string;
        quantity: string;
        supplier: string;
        supplierReference: string;
    };

    public constructor(private apiService: ApiService,
                       private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private storageService: StorageService,
                       private navService: NavService,
                       private barcodeScannerManager: BarcodeScannerManagerService) {
    }

    public ionViewWillEnter(): void {
        this.bodyConfig = [];
        this.rfidTag = this.navService.param<string>('rfidTag');

        this.headerConfig = {
            leftIcon: {
                name: 'new-article-RFID.svg'
            },
            title: `CODE RFID : ${this.rfidTag}`,
            rightIcon: {
                name: 'scan-photo.svg',
                color: 'primary',
                action: () => {
                    if (this.footerScannerComponent) {
                        this.footerScannerComponent.scan();
                    }
                }
            },
        }

        this.loading = true;
        this.loadingService.presentLoadingWhile({
            event: () => this.retrieveDefaultValues()
        }).subscribe(() => {
            this.initForm();
            this.loading = false;
        });
    }

    public ionViewWillLeave(): void {
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    public initForm(): void {
        const values = this.formPanelComponent && Object.keys(this.formPanelComponent.values).length > 0 ? this.formPanelComponent.values : null;
        this.bodyConfig = [
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Type',
                    name: 'type',
                    value: values ? values.type : (this.defaultValues.type || null),
                    inputConfig: {
                        searchType: SelectItemTypeEnum.TYPE,
                        required: true,
                        requestParams: [
                            `category = 'article'`,
                        ],
                    },
                    errors: {
                        required: `Le type est requis`,
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
                        required: true,
                        onChange: (reference: any) => {
                            this.reference = reference;
                            if (this.supplier) {
                                this.importSupplierReferences().subscribe(() => {
                                    this.initForm();
                                });
                            }
                        }
                    },
                    errors: {
                        required: `La référence de l'article est requise`,
                    },
                }
            },
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Emplacement de destination',
                    value: values ? values.destination : (this.defaultValues.destination || null),
                    name: 'destination',
                    inputConfig: {
                        searchType: SelectItemTypeEnum.LOCATION,
                        required: true,
                        disabled: false,
                    },
                    errors: {
                        required: `L'emplacement de destination de l'article est requis`,
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
                        required: true,
                        onChange: (supplier: any) => {
                            this.supplier = supplier;
                            if (this.reference) {
                                this.importSupplierReferences().subscribe(() => {
                                    this.initForm();
                                })
                            }
                        }
                    },
                    errors: {
                        required: `Le fournisseur de l'article est requis`,
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
                        required: true,
                        disabled: !this.supplier || !this.reference,
                    },
                    errors: {
                        required: `La référence fournisseur est requise`,
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
                        type: 'text',
                        required: true,
                    },
                    errors: {
                        required: `Le libellé de l'article est requis`,
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
                        type: 'number',
                        required: true,
                    },
                    errors: {
                        required: `La quantité est requise`,
                    },
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Prix unitaire',
                    name: 'price',
                    value: 0,
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

    public onDatamatrixScanned(value: string): void {
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

    public validate(matrixValues?: {[field: string]: string}) {
        const params: {[field: string]: string|boolean|number} = {
            rfidTag: this.rfidTag,
            ...(matrixValues ? {fromMatrix: 1} : {}),
            ...this.formPanelComponent.values,
            ...(matrixValues || {})
        };

        const formError = this.formPanelComponent.firstError;
        if (!params.fromMatrix && formError) {
            this.toastService.presentToast(formError)
        } else {
            this.loading = true;
            this.loadingService.presentLoadingWhile({
                event: () => this.storageService.getRight(StorageKeyEnum.PARAMETER_ARTICLE_LOCATION_DROP_WITH_REFERENCE_STORAGE_RULE)
                    .pipe(
                        mergeMap((needsLocationCheck) => needsLocationCheck
                            ? this.sqliteService.findOneById('reference_article', this.reference)
                            : of(false)),
                        mergeMap((reference: any) => reference
                            ? this.sqliteService.findBy(`emplacement`, [`id IN (${reference.storageRuleLocations})`])
                            : of(undefined))
                    )
            }).subscribe((restrictedLocations: Array<Emplacement>|undefined) => {
                if (restrictedLocations) {
                    this.navService.push(NavPathEnum.EMPLACEMENT_SCAN, {
                        fromDepose: false,
                        fromStock: true,
                        restrictedLocations,
                        scanMode: BarcodeScannerModeEnum.ONLY_SCAN,
                        customAction: (location: Emplacement) => {
                            this.navService.pop()
                                .subscribe(() => this.createArticle(location, params));
                        },
                    });
                } else {
                    this.createArticle(undefined, params);
                }
            });
        }
    }

    public createArticle(location: Emplacement|undefined, params: any) {
        if(location) {
            params.destination = location.id;
        }
        this.loadingService.presentLoadingWhile({
            event: () => this.apiService.requestApi(ApiService.CREATE_ARTICLE, {params})
        }).subscribe((response) => {
            this.loading = false;
            this.toastService.presentToast(response.message || response.msg);
            if (response.success) {
                this.navService.pop();
            }
        });
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
