import {Component, ViewChild} from '@angular/core';
import {NavService} from '@app/services/nav/nav.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {LoadingService} from '@app/services/loading.service';
import {ToastService} from '@app/services/toast.service';
import {FormPanelComponent} from "@common/components/panel/form-panel/form-panel.component";
import {FormPanelParam} from "@common/directives/form-panel/form-panel-param";
import {
    FormPanelSelectComponent
} from "@common/components/panel/form-panel/form-panel-select/form-panel-select.component";
import {FormPanelInputComponent} from "@common/components/panel/form-panel/form-panel-input/form-panel-input.component";
import {
    FormPanelToggleComponent
} from "@common/components/panel/form-panel/form-panel-toggle/form-panel-toggle.component";
import {
    FormPanelTextareaComponent
} from "@common/components/panel/form-panel/form-panel-textarea/form-panel-textarea.component";
import {
    FormPanelCameraComponent
} from "@common/components/panel/form-panel/form-panel-camera/form-panel-camera.component";
import {CardListColorEnum} from "@common/components/card-list/card-list-color.enum";
import {HeaderConfig} from "@common/components/panel/model/header-config";
import {ApiService} from "@app/services/api.service";
import {
    FormPanelButtonsComponent
} from "@common/components/panel/form-panel/form-panel-buttons/form-panel-buttons.component";
import {DispatchReference} from "@entities/dispatch-reference";
import {Dispatch} from "@entities/dispatch";
import {Observable, of, zip} from "rxjs";
import {ViewWillEnter} from "@ionic/angular";
import {StorageKeyEnum} from "@app/services/storage/storage-key.enum";
import {map, mergeMap, tap} from "rxjs/operators";
import {StorageService} from "@app/services/storage/storage.service";
import {AssociatedDocumentType} from "@entities/associated-document-type";
import {DispatchPack} from "@entities/dispatch-pack";
import {SelectItemTypeEnum} from "@common/components/select-item/select-item-type.enum";
import {Nature} from "@entities/nature";

@Component({
    selector: 'wii-dispatch-logistic-unit-reference-association',
    templateUrl: './dispatch-logistic-unit-reference-association.page.html',
    styleUrls: ['./dispatch-logistic-unit-reference-association.page.scss'],
})
export class DispatchLogisticUnitReferenceAssociationPage implements ViewWillEnter {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public formConfig: Array<FormPanelParam> | any;
    public headerConfig: HeaderConfig;

    public logisticUnit: string;
    public dispatch: Dispatch;
    public reference: DispatchReference | any = {};
    public volume?: number = undefined;
    public packData?: {
        natureId?: number;
        weight?: number;
        volume?: number;
        comment?: string;
    } = {};
    public disableValidate: boolean = true;
    public disabledAddReference: boolean = true;
    public associatedDocumentTypeElements: Array<AssociatedDocumentType>;

    public edit: boolean = false;
    public viewMode: boolean = false;
    public offlineMode: boolean = false;
    public defaultNature: Nature;

    public constructor(private storageService: StorageService,
                       private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private toastService: ToastService,
                       private apiService: ApiService,
                       private navService: NavService) {
    }

    public ionViewWillEnter(): void {
        this.loadingService.presentLoadingWhile({
            event: () => {
                return zip(
                    this.storageService.getRight(StorageKeyEnum.DISPATCH_OFFLINE_MODE),
                    this.sqliteService.findAll('associated_document_type'),
                    this.sqliteService.findOneBy(`nature`, {defaultNature: `1`})
                )
            }
        }).subscribe(([dispatchOfflineMode, documentTypeElements, defaultNature]) => {
            this.offlineMode = dispatchOfflineMode;
            this.defaultNature = defaultNature;
            this.associatedDocumentTypeElements = documentTypeElements;
            this.reference = this.navService.param(`reference`) || {};
            this.edit = this.navService.param(`edit`) || false;
            this.viewMode = this.navService.param(`viewMode`) || false;
            this.logisticUnit = this.navService.param(`logisticUnit`);
            this.dispatch = this.navService.param(`dispatch`);

            this.getFormConfig();
            this.createHeaderConfig();
            if (Object.keys(this.reference).length > 0) {
                this.disableValidate = false;
            }
        });
    }

    private getFormConfig(values: any = {}) {
        /* TODO adrien remove */
        this.loadingService.presentLoadingWhile({
            event: () => {
                return this.viewMode && !this.offlineMode
                    ? this.apiService.requestApi(ApiService.GET_ASSOCIATED_REF, {
                        pathParams: {
                            pack: this.logisticUnit,
                            dispatch: this.dispatch.id as number
                        }
                    })
                    : this.viewMode
                        ? (this.sqliteService.findOneBy('dispatch_pack', {
                            code: this.logisticUnit,
                            localDispatchId: this.dispatch.localId
                        })
                            .pipe(
                                mergeMap((dispatchPack: DispatchPack) => {
                                    return (
                                            this.sqliteService.findOneBy('dispatch_reference', {localDispatchPackId: dispatchPack.localId})
                                                .pipe(
                                                    map((dispatchReference: DispatchReference) => of({
                                                        packComment: dispatchPack?.comment,
                                                        packWeight: dispatchPack?.weight,
                                                        packVolume: dispatchPack?.volume,
                                                        natureId: dispatchPack.natureId,
                                                        ...dispatchReference,
                                                    }))
                                                )
                                        )
                                    }
                                ),
                            ))
                        : of({})
            }
        }).subscribe((response) => {
            let data = Object.keys(values).length > 0 ? values : this.reference;
            if (response.reference) {
                data = response;
            }

            const {
                reference,
                quantity,
                outFormatEquipment,
                manufacturerCode,
                sealingNumber,
                serialNumber,
                batchNumber,
                width,
                height,
                length,
                volume,
                weight,
                adr,
                comment,
                photos,
                exists,
                packComment,
                packWeight,
                packVolume,
            } = data;

            const associatedDocumentTypes = data.associatedDocumentTypes || this.reference.associatedDocumentTypes;

            if (this.viewMode) {
                if (length && width && height) {
                    this.preComputeVolume(length, width, height);
                } else if (volume) {
                    this.volume = volume;
                }
            }

            this.formConfig = [
                {
                    item: FormPanelSelectComponent,
                    config: {
                        label: 'Nature',
                        name: 'natureId',
                        value: this.reference?.natureId || this.packData?.natureId || this.defaultNature?.id || null,
                        inputConfig: {
                            required: true,
                            searchType: SelectItemTypeEnum.TRACKING_NATURES,
                            filterItem: (nature: Nature) => (!nature.hide),
                            disabled: this.viewMode,
                        },
                        errors: {
                            required: 'Vous devez renseigner une nature.'
                        },
                    }
                },
                {
                    item: FormPanelInputComponent,
                    config: {
                        label: 'Poids (kg)',
                        name: 'packWeight',
                        value: this.packData?.weight ?? (packWeight ? Number(packWeight) : null),
                        inputConfig: {
                            type: 'number',
                            required: false,
                            disabled: this.viewMode
                        },
                        errors: {
                            required: 'Vous devez renseigner un poids.'
                        }
                    }
                },
                {
                    item: FormPanelInputComponent,
                    config: {
                        label: 'Volume (m3)',
                        name: 'packVolume',
                        value: this.packData?.volume ?? (packVolume ? Number(packVolume) : null),
                        inputConfig: {
                            type: 'number',
                            required: false,
                            disabled: this.viewMode
                        },
                        errors: {
                            required: 'Vous devez renseigner un poids.'
                        }
                    }
                },
                {
                    item: FormPanelTextareaComponent,
                    config: {
                        label: 'Commentaire',
                        name: 'packComment',
                        value: this.packData?.comment || packComment || null,
                        inputConfig: {
                            disabled: this.viewMode
                        },
                    }
                },
                {
                    item: FormPanelInputComponent,
                    config: {
                        label: 'Référence',
                        name: 'reference',
                        value: reference ? reference : null,
                        inputConfig: {
                            required: true,
                            type: 'text',
                            onChange: (value: any) => this.disabledAddReference = value == ``,
                            disabled: this.viewMode || this.edit,
                        },
                        errors: {
                            required: 'Vous devez renseigner une réference.'
                        },
                    },
                },
                ...(!this.edit
                    ? [{
                        item: FormPanelButtonsComponent,
                        config: {
                            inputConfig: {
                                type: 'text',
                                disabled: this.disabledAddReference,
                                elements: [
                                    {id: `searchRef`, label: `Rechercher`}
                                ],
                                onChange: () => this.getReference(),
                            },
                        }
                    }]
                    : [])
            ];
            if (Object.keys(values).length > 0 || Object.keys(this.reference).length > 0 || this.viewMode) {
                this.formConfig.push({
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Quantité',
                            name: 'quantity',
                            value: quantity || (this.reference && this.reference.quantity ? this.reference.quantity : null),
                            inputConfig: {
                                required: true,
                                type: 'number',
                                min: 1,
                                disabled: this.viewMode
                            },
                            errors: {
                                required: 'Vous devez renseigner une quantité.'
                            }
                        }
                    },
                    {
                        item: FormPanelToggleComponent,
                        config: {
                            label: 'Matériel hors format',
                            name: 'outFormatEquipment',
                            value: outFormatEquipment ? Number(outFormatEquipment) : null,
                            inputConfig: {
                                disabled: this.viewMode
                            },
                        }
                    },
                    {
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Numéro de série',
                            name: 'serialNumber',
                            value: serialNumber || null,
                            inputConfig: {
                                required: true,
                                type: 'text',
                                disabled: this.viewMode
                            },
                            errors: {
                                required: 'Vous devez renseigner un numéro de série.'
                            },
                        }
                    },
                    {
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Numéro de lot',
                            name: 'batchNumber',
                            value: batchNumber || null,
                            inputConfig: {
                                required: true,
                                type: 'text',
                                disabled: this.viewMode
                            },
                            errors: {
                                required: 'Vous devez renseigner un numéro de lot.'
                            }
                        }
                    },
                    {
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Numéro de plombage/scellé',
                            value: sealingNumber || null,
                            name: 'sealingNumber',
                            inputConfig: {
                                type: 'text',
                                disabled: this.viewMode
                            },
                        }
                    },
                    {
                        item: FormPanelToggleComponent,
                        config: {
                            label: 'ADR',
                            name: 'adr',
                            value: adr ? Boolean(adr) : null,
                            inputConfig: {
                                disabled: this.viewMode
                            },
                        }
                    },
                    {
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Code fabriquant',
                            name: 'manufacturerCode',
                            value: manufacturerCode || null,
                            inputConfig: {
                                type: 'text',
                                disabled: this.viewMode
                            },
                        }
                    },
                    {
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Longueur (cm)',
                            name: 'length',
                            value: length ? Number(length) : null,
                            inputConfig: {
                                type: 'number',
                                disabled: this.viewMode
                            },
                        }
                    },
                    {
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Largeur (cm)',
                            name: 'width',
                            value: width ? Number(width) : null,
                            inputConfig: {
                                type: 'number',
                                disabled: this.viewMode
                            },
                        }
                    },
                    {
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Hauteur (cm)',
                            name: 'height',
                            value: height ? Number(height) : null,
                            inputConfig: {
                                type: 'number',
                                disabled: this.viewMode
                            },
                        }
                    },
                    ...(!this.viewMode ? [{
                        item: FormPanelButtonsComponent,
                        config: {
                            inputConfig: {
                                type: 'text',
                                disabled: this.viewMode,
                                elements: [
                                    {id: `compute`, label: `Calculer volume`}
                                ],
                                onChange: () => this.computeVolumeField(),
                            },
                        }
                    }] : []),
                    {
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Volume (m3)',
                            name: 'volume',
                            value: this.volume || Number(volume),
                            inputConfig: {
                                type: 'number',
                                required: true,
                                disabled: true,
                            },
                            errors: {
                                required: `Un volume est nécéssaire.`
                            }
                        }
                    },
                    {
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Poids (kg)',
                            name: 'weight',
                            value: weight ? Number(weight) : null,
                            inputConfig: {
                                type: 'number',
                                required: true,
                                disabled: this.viewMode
                            },
                            errors: {
                                required: 'Vous devez renseigner un poids.'
                            }
                        }
                    },
                    {
                        item: FormPanelSelectComponent,
                        config: {
                            label: 'Types de documents associés',
                            name: 'associatedDocumentTypes',
                            value: associatedDocumentTypes
                                ? (
                                    associatedDocumentTypes
                                        ? associatedDocumentTypes
                                            .split(',')
                                            .filter((label: string) => label)
                                            .map((label: string) => ({
                                                id: label,
                                                label
                                            }))
                                        : this.associatedDocumentTypeElements.map(({label}) => ({
                                            id: label,
                                            label
                                        }))
                                ) : null,
                            inputConfig: {
                                required: true,
                                elements: this.associatedDocumentTypeElements.map(({label}) => ({
                                    id: label,
                                    label
                                })),
                                isMultiple: true,
                                disabled: this.viewMode
                            },
                            errors: {
                                required: 'Vous devez renseigner au moins un type de document associé.'
                            }
                        }
                    },
                    {
                        item: FormPanelTextareaComponent,
                        config: {
                            label: 'Commentaire',
                            name: 'comment',
                            value: comment || null,
                            inputConfig: {
                                disabled: this.viewMode
                            },
                        }
                    },
                    {
                        item: FormPanelCameraComponent,
                        config: {
                            label: 'Photo(s)',
                            name: 'photos',
                            value: photos ? JSON.parse(photos) : null,
                            inputConfig: {
                                multiple: true,
                                disabled: this.viewMode
                            }
                        }
                    });
            }


        })
    }

    private createHeaderConfig(): any {
        this.headerConfig = {
            transparent: true,
            leftIcon: {
                name: 'scanned-pack.svg',
                color: CardListColorEnum.PURPLE
            },
            title: `Unité logistique`,
            subtitle: this.logisticUnit
        };
    }

    public validate(): void {
        if (this.formPanelComponent.firstError) {
            this.toastService.presentToast(this.formPanelComponent.firstError);
        } else {
            const reference = Object.keys(this.formPanelComponent.values).reduce((acc: any, key) => {
                if (this.formPanelComponent.values[key] !== undefined && key !== 'undefined') {
                    acc[key] = (key === 'associatedDocumentTypes')
                        ? this.formPanelComponent.values[key].replace(/;/g, ',')
                        : this.formPanelComponent.values[key];
                }

                return acc;
            }, {});
            if (!this.reference.exists && !reference.volume) {
                this.toastService.presentToast(`Le calcul du volume est nécessaire pour valider l'ajout de la référence.`)
            } else {
                this.loadingService.presentLoadingWhile({
                    event: () => this.sqliteService.findBy(`dispatch_pack`, [
                        `code = '${this.logisticUnit}'`,
                        this.dispatch.id ? `dispatchId = ${this.dispatch.id || ''}` : `localDispatchId = ${this.dispatch.localId || ''}`
                    ]).pipe(
                        mergeMap((dispatchPacks) => {
                            const deletedIds = dispatchPacks.map(({localId}) => localId);
                            return deletedIds.length > 0
                                ? zip(
                                    this.sqliteService.deleteBy(`dispatch_pack`, [`localId IN (${deletedIds.join(',')})`,]),
                                    this.sqliteService.deleteBy(`dispatch_reference`, [`localDispatchPackId IN (${deletedIds.join(',')})`,]),
                                )
                                : of(undefined);
                        }),
                        mergeMap(() => this.sqliteService.insert(`dispatch_pack`, {
                            code: this.logisticUnit,
                            quantity: reference.quantity,
                            dispatchId: this.dispatch.id,
                            localDispatchId: this.dispatch.localId,
                            treated: 1,
                            natureId: reference.natureId,
                            comment: reference.packComment,
                            volume: reference.packVolume,
                            weight: reference.packWeight,
                        })),
                        tap((dispatchPackId) => {
                            reference.localDispatchPackId = dispatchPackId as number;
                            delete reference.natureId;
                            delete reference.packComment;
                            delete reference.packVolume;
                            delete reference.packWeight;
                        }),
                        mergeMap(() => this.sqliteService.insert(`dispatch_reference`, reference)),
                        mergeMap(() => this.updateDispatch()),
                    )
                }).subscribe(() => {
                    this.navService.pop();
                });
            }
        }
    }

    public updateDispatch() {
        return this.sqliteService.findBy('dispatch_pack', [`localDispatchId = ${this.dispatch.localId}`]).pipe(
            mergeMap((dispatchPacks) => {
                const dispatchPackLocalIds = dispatchPacks.map((dispatchPack: DispatchPack) => dispatchPack.localId);
                const dispatchPackCodes = dispatchPacks.map((dispatchPack: DispatchPack) => dispatchPack.code);
                return zip(
                    this.sqliteService.update(`dispatch`, [{
                        values: {
                            packs: `${dispatchPackCodes.join(',')}`,
                        },
                        where: [`localId = ${this.dispatch.localId}`]
                    }])
                ).pipe(
                    mergeMap(() => this.sqliteService.findBy('dispatch_reference', [`localDispatchPackId IN (${dispatchPackLocalIds.join(',')})`]))
                )
            }),
            mergeMap((dispatchReferences) => {
                const dispatchPackReferences = dispatchReferences.map((dispatchReference: DispatchReference) => dispatchReference.reference);
                const dispatchReferenceQuantities = dispatchReferences.map((dispatchReference: DispatchReference) => `${dispatchReference.reference} (${dispatchReference.quantity})`);
                return this.sqliteService.update(`dispatch`, [{
                    values: {
                        packReferences: `${dispatchPackReferences.join(',')}`,
                        quantities: `${dispatchReferenceQuantities.join(',')}`,
                    },
                    where: [`localId = ${this.dispatch.localId}`]
                }]);
            })
        );
    }

    public getReference() {
        const {reference, natureId, packWeight, packVolume, packComment} = this.formPanelComponent.values;
        if (reference && natureId) {
            this.loadingService.presentLoadingWhile({
                event: () => this.getReferenceEvent(reference),
                message: `Récupération des informations de la référence en cours...`
            }).subscribe(({reference}) => {
                this.disableValidate = false;
                this.reference = reference;
                this.packData = {
                    natureId,
                    weight: packWeight,
                    volume: packVolume,
                    comment: packComment,
                };
                this.getFormConfig();
            });
        } else {
            this.toastService.presentToast(!natureId
                ? `Veuillez renseigner une nature.`
                : (!reference
                    ? `Veuillez renseigner une référence valide.`
                    : '')
            );
        }
    }

    private getReferenceEvent(reference: string): Observable<any> {
        if (this.offlineMode) {
            return this.sqliteService.findOneBy('reference_article', {reference})
                .pipe(
                    mergeMap((localRef?: DispatchReference) => {
                        let serializedReference;
                        if (localRef) {
                            serializedReference = {
                                reference: localRef.reference,
                                outFormatEquipment: localRef.outFormatEquipment ?? '',
                                manufacturerCode: localRef.manufacturerCode ?? '',
                                width: localRef.width ?? '',
                                height: localRef.height ?? '',
                                length: localRef.length ?? '',
                                volume: localRef.volume ?? '',
                                weight: localRef.weight ?? '',
                                associatedDocumentTypes: localRef.associatedDocumentTypes ?? '',
                                exists: true,
                            };
                        } else {
                            serializedReference = {
                                reference: reference,
                                exists: false,
                            };
                        }
                        return of({
                            success: true,
                            reference: serializedReference,
                        });
                    })
                );
        } else {
            return this.apiService.requestApi(ApiService.GET_REFERENCE, {params: {reference}});
        }
    }

    private computeVolumeField(): void {
        const values = this.formPanelComponent.values;
        const {length, width, height} = values;

        if (length && width && height) {
            this.preComputeVolume(length, width, height);
            this.getFormConfig(values);
        } else {
            this.toastService.presentToast(`Veuillez renseigner des valeurs valides pour le calcul du volume.`);
        }
    }

    private preComputeVolume(length: number, width: number, height: number) {
        const volumeCentimeters = length * width * height;
        const volumeMeters = volumeCentimeters / Math.pow(10, 6);
        this.volume = volumeMeters ? Number(volumeMeters.toFixed(6)) : undefined;
    }

    public formIsLoaded() {
        document.getElementsByName('reference')[0].focus();
    }
}
