import {Component, ViewChild} from '@angular/core';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {StorageService} from '@app/services/storage/storage.service';
import {MainHeaderService} from '@app/services/main-header.service';
import {NavService} from '@app/services/nav/nav.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {ToastService} from '@app/services/toast.service';
import {LoadingService} from '@app/services/loading.service';
import {AlertService} from '@app/services/alert.service';
import {NetworkService} from '@app/services/network.service';
import {TranslationService} from "@app/services/translations.service";
import {
    FormPanelSelectComponent
} from "@common/components/panel/form-panel/form-panel-select/form-panel-select.component";
import {SelectItemTypeEnum} from "@common/components/select-item/select-item-type.enum";
import {FormPanelInputComponent} from "@common/components/panel/form-panel/form-panel-input/form-panel-input.component";
import {FormPanelParam} from "@common/directives/form-panel/form-panel-param";
import {
    FormPanelTextareaComponent
} from "@common/components/panel/form-panel/form-panel-textarea/form-panel-textarea.component";
import {FormPanelComponent} from "@common/components/panel/form-panel/form-panel.component";
import {ApiService} from "@app/services/api.service";
import {Observable, of, zip} from "rxjs";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";
import {map, mergeMap, tap} from "rxjs/operators";
import {Translations} from "@database/translation";
import {ViewWillEnter} from "@ionic/angular";
import {StorageKeyEnum} from "@app/services/storage/storage-key.enum";
import {Dispatch} from "@database/dispatch";
import * as moment from "moment";
import {DispatchEmergency} from "@database/dispatch-emergency";


@Component({
    selector: 'wii-dispatch-new',
    templateUrl: './dispatch-new.page.html',
    styleUrls: ['./dispatch-new.page.scss'],
})
export class DispatchNewPage implements ViewWillEnter {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public formConfig: Array<FormPanelParam>|any;

    private emergencies: Array<{id: string; label: string;}> = [];
    private dispatchOfflineMode: boolean;
    private dispatchTranslations: Translations;

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

    private savedInputData: any;

    public constructor(private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private storageService: StorageService,
                       private translationService: TranslationService,
                       private apiService: ApiService,
                       private navService: NavService) {
    }

    public ionViewWillEnter(): void {
        this.loadingService.presentLoadingWhile({
            event: () => {
                return zip(
                    this.sqliteService.findAll('dispatch_emergency'),

                    this.storageService.getRight(StorageKeyEnum.DISPATCH_OFFLINE_MODE),

                    this.translationService.getRaw(`Demande`, `Acheminements`, `Champs fixes`),
                    this.translationService.getRaw(`Demande`, `Acheminements`, `Général`),

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

                    this.storageService.getItem('acheminements.emails.requiredCreate'),
                    this.storageService.getItem('acheminements.emails.requiredCreate'),
                )
            }
        }).subscribe(([emergencies, dispatchOfflineMode, fieldsTranslations, generalTranslations,  ...fieldsParam]) => {
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
            ] = fieldsParam;

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
            const fullTranslations = fieldsTranslations.concat(generalTranslations);
            this.dispatchTranslations = TranslationService.CreateTranslationDictionaryFromArray(fullTranslations);
            this.emergencies = emergencies.map((displayEmergency: DispatchEmergency) => ({
                id: displayEmergency.label,
                label: displayEmergency.label,
            }));
            this.dispatchOfflineMode = dispatchOfflineMode;
            this.getFormConfig();
        });
    }

    private getFormConfig(type: any = undefined) {
        this.formConfig = [
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Type',
                    name: 'type',
                    ...type ? {
                        value: this.savedInputData.type,
                    } : {},
                    inputConfig: {
                        required: true,
                        searchType: SelectItemTypeEnum.TYPE,
                        requestParams: [
                            `category = 'acheminements'`,
                            'active = 1',
                        ],
                        onChange: (typeId: any) => {
                            this.loadingService.presentLoadingWhile({
                                event: () => this.sqliteService.findOneBy(`type`, {id: typeId})
                            }).subscribe((type) => {
                                this.savedInputData = this.formPanelComponent.values;
                                this.getFormConfig(type);
                            });
                        }
                    },
                    errors: {
                        required: 'Vous devez sélectionner un type.'
                    }
                }
            },
            ...(type && this.fieldParams.displayCarrierTrackingNumber.includes(String(type.id)) ? [{
                item: FormPanelInputComponent,
                config: {
                    label: TranslationService.Translate(this.dispatchTranslations, 'N° tracking transporteur'),
                    name: 'carrierTrackingNumber',
                    ...type ? {
                        value: this.savedInputData.carrierTrackingNumber,
                    } : {},
                    inputConfig: {
                        required: Boolean(this.fieldParams.needsCarrierTrackingNumber.includes(String(type.id))),
                        type: 'text',
                    },
                    errors: {
                        required: 'Vous devez renseigner un numéro de tracking transporteur.'
                    }
                }
            }] : []),
            ...(type && this.fieldParams.displayPickLocation.includes(String(type.id)) ? [{
                item: FormPanelSelectComponent,
                config: {
                    label: TranslationService.Translate(this.dispatchTranslations, 'Emplacement de prise'),
                    name: 'pickLocation',
                    inputConfig: {
                        required: Boolean(this.fieldParams.needsPickLocation.includes(String(type.id))),
                        searchType: SelectItemTypeEnum.LOCATION,
                        ...type && type.suggestedPickLocations !== '' ? {
                            filterItem: (location: any) => type.suggestedPickLocations
                                .split(`,`)
                                .findIndex((suggestedPickLocation: string) => Number(suggestedPickLocation) === Number(location.id)) !== -1,
                        } : {}
                    },
                    errors: {
                        required: 'Vous devez sélectionner un emplacement de prise.'
                    }
                }
            }] : []),
            ...(type && this.fieldParams.displayDropLocation.includes(String(type.id))
                ? [{
                    item: FormPanelSelectComponent,
                    config: {
                        label: TranslationService.Translate(this.dispatchTranslations, 'Emplacement de dépose'),
                        name: 'dropLocation',
                        inputConfig: {
                            required: Boolean(this.fieldParams.needsDropLocation.includes(String(type.id))),
                            searchType: SelectItemTypeEnum.LOCATION,
                            ...type && type.suggestedDropLocations !== '' ? {
                                filterItem: (location: any) => type.suggestedDropLocations
                                    .split(`,`)
                                    .findIndex((suggestedDropLocation: string) => Number(suggestedDropLocation) === Number(location.id)) !== -1
                            } : {}
                        },
                        errors: {
                            required: 'Vous devez sélectionner un emplacement de dépose.'
                        }
                    }
                }]
                : []),
            ...(type && this.fieldParams.displayComment.includes(String(type.id)) ? [{
                item: FormPanelTextareaComponent,
                config: {
                    label: `Commentaire`,
                    name: 'comment',
                    ...type ? {
                        value: this.savedInputData.comment,
                    } : {},
                    inputConfig: {
                        required: Boolean(this.fieldParams.needsComment.includes(String(type.id))),
                        maxLength: '512',
                    },
                    errors: {
                        required: 'Le commentaire est requis.',
                    }
                }
            }] : []),
            ...(type && this.fieldParams.displayEmergency.includes(String(type.id)) ? [{
                item: FormPanelSelectComponent,
                config: {
                    label: 'Urgence',
                    name: 'emergency',
                    ...type ? {
                        value: this.savedInputData.emergency,
                    } : {},
                    inputConfig: {
                        required: Boolean(this.fieldParams.needsEmergency.includes(String(type.id))),
                        elements: this.emergencies
                    },
                    errors: {
                        required: 'Vous devez sélectionner une urgence.'
                    }
                }
            }] : []),
            ...(type && this.fieldParams.displayReceiver.includes(String(type.id)) ? [{
                item: FormPanelSelectComponent,
                config: {
                    label: 'Destinataire',
                    name: 'receiver',
                    ...type ? {
                        value: this.savedInputData.receiver,
                    } : {},
                    inputConfig: {
                        required: Boolean(this.fieldParams.needsReceiver.includes(String(type.id))),
                        searchType: SelectItemTypeEnum.USER,
                    },
                    errors: {
                        required: 'Vous devez sélectionner un destinataire.'
                    }
                }
            }] : []),
            ...(type && this.fieldParams.displayEmails.includes(String(type.id)) ? [{
                item: FormPanelInputComponent,
                config: {
                    label: 'Email(s)',
                    name: 'emails',
                    ...type ? {
                        value: this.savedInputData.emails,
                    } : {},
                    inputConfig: {
                        required: Boolean(this.fieldParams.needsEmails.includes(String(type.id))),
                        type: 'text',
                    }
                }
            }] : []),
        ];
    }

    public validate() {
        if (this.formPanelComponent.firstError) {
            this.toastService.presentToast(this.formPanelComponent.firstError);
        } else {
            const values = this.formPanelComponent.values;
            this.loadingService.presentLoadingWhile({
                event: () => of(undefined).pipe(
                    mergeMap(() => this.trySavingDispatch(values)),
                    mergeMap(({success, message, dispatch}) => (
                        success && dispatch
                            ? (this.sqliteService.insert(`dispatch`, dispatch) as Observable<number>)
                            : of({success, message, dispatch})
                    )),
                    mergeMap((result: number | {success: boolean; message?: string, dispatch?: Dispatch}) => {
                        // if number -> dispatch is inserted
                        if (typeof result === `number`) {
                            return this.navService.pop()
                                .pipe(
                                    mergeMap(() => {
                                        return this.navService.push(NavPathEnum.DISPATCH_PACKS, {
                                            localDispatchId: result,
                                            fromCreate: true,
                                        });
                                    }),
                                    map(() => ({redirect: true}))
                                );
                        } else if (result.success && !result.dispatch) {
                            return this.navService.pop().pipe(map(() => result));
                        }
                        else {
                            return of(result);
                        }
                    })
                ),
                message: `Création de l'acheminement en cours...`,
            }).subscribe((result: {success?: boolean; message?: string; redirect?: boolean}) => {
                if (result.message) {
                    this.toastService.presentToast(result.message);
                }
            });
        }
    }

    private trySavingDispatch(values: any): Observable<{success: boolean, message?: string, dispatch: Dispatch}> {
        if (this.dispatchOfflineMode) {
            return this.formValuesToDispatch(values).pipe(
                map((dispatch) => ({
                    success: true,
                    dispatch,
                }))
            );
        }
        else {
            return this.apiService.requestApi(ApiService.NEW_DISPATCH, {params: values});
        }

    }

    private formValuesToDispatch(values: any): Observable<Dispatch> {
        return zip(
            values.type ? this.sqliteService.findOneBy('type', {id: values.type}) : of(undefined),
            values.pickLocation ? this.sqliteService.findOneBy('emplacement', {id: values.pickLocation}) : of(undefined),
            values.dropLocation ? this.sqliteService.findOneBy('emplacement', {id: values.dropLocation}) : of(undefined),
            this.storageService.getString(StorageKeyEnum.OPERATOR),
            this.storageService.getNumber(StorageKeyEnum.OPERATOR_ID),
            this.sqliteService.findBy('status', [
                `state = 'draft'`,
                `category = 'acheminement'`,
                `typeId = ${values.type}`
            ], {displayOrder: 'ASC'})
        ).pipe(
            map(([type, pickLocation, dropLocation, requester, requesterId, statuses]) => ({
                typeId: type?.id,
                typeLabel: type?.label,
                locationFromId: pickLocation?.id,
                locationFromLabel: pickLocation?.label,
                locationToId: dropLocation?.id,
                locationToLabel: dropLocation?.label,
                requester,
                draft: true,
                comment: values.comment,
                carrierTrackingNumber: values.carrierTrackingNumber,
                emergency: values.emergency,
                statusId: statuses[0]?.id,
                statusLabel: statuses[0]?.label,
                groupedSignatureStatusColor: statuses[0]?.groupedSignatureStatusColor,
                createdAt: moment().format(),
                createdBy: requesterId,
            } as Dispatch))
        )
    }
}
