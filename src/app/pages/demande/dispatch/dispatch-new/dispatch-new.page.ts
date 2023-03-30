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
import {
    FormPanelInputComponent
} from "@common/components/panel/form-panel/form-panel-input/form-panel-input.component";
import {FormPanelParam} from "@common/directives/form-panel/form-panel-param";
import {
    FormPanelTextareaComponent
} from "@common/components/panel/form-panel/form-panel-textarea/form-panel-textarea.component";
import {FormPanelComponent} from "@common/components/panel/form-panel/form-panel.component";
import {ApiService} from "@app/services/api.service";
import {Observable, of, zip} from "rxjs";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";
import {mergeMap} from "rxjs/operators";
import {Translations} from "@entities/translation";
import {ViewWillEnter} from "@ionic/angular";


@Component({
    selector: 'wii-dispatch-new',
    templateUrl: './dispatch-new.page.html',
    styleUrls: ['./dispatch-new.page.scss'],
})
export class DispatchNewPage implements ViewWillEnter {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public formConfig: Array<FormPanelParam>|any;

    private emergencies: Array<{id: number; label: string}> = [];
    private dispatchTranslations: Translations;

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
                       private networkService: NetworkService,
                       private alertService: AlertService,
                       private mainHeaderService: MainHeaderService,
                       private localDataManager: LocalDataManagerService,
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
                    this.apiService.requestApi(ApiService.GET_DISPATCH_EMERGENCIES),
                    this.translationService.getRaw(`Demande`, `Acheminements`, `Champs fixes`),
                    this.translationService.getRaw(`Demande`, `Acheminements`, `Général`),

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
                )
            }
        }).subscribe(([emergencies, fieldsTranslations, generalTranslations,  ...fieldsParam]) => {
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
            ] = fieldsParam;
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
            const fullTranslations = fieldsTranslations.concat(generalTranslations);
            this.dispatchTranslations = TranslationService.CreateTranslationDictionaryFromArray(fullTranslations);
            this.emergencies = emergencies;
            this.getFormConfig();
        });
    }

    private getFormConfig() {

        this.formConfig = [
            ...(this.fieldParams.displayCarrierTrackingNumber ? [{
                item: FormPanelInputComponent,
                config: {
                    label: TranslationService.Translate(this.dispatchTranslations, 'N° tracking transporteur'),
                    name: 'carrierTrackingNumber',
                    inputConfig: {
                        required: Boolean(this.fieldParams.needsCarrierTrackingNumber),
                        type: 'text',
                    },
                    errors: {
                        required: 'Vous devez renseigner un numéro de tracking transporteur.'
                    }
                }
            }] : []),
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Type',
                    name: 'type',
                    inputConfig: {
                        required: true,
                        searchType: SelectItemTypeEnum.TYPE,
                        requestParams: [
                            `category = 'acheminements'`,
                        ],
                    },
                    errors: {
                        required: 'Vous devez sélectionner un type.'
                    }
                }
            },
            ...(this.fieldParams.displayPickLocation ? [{
                item: FormPanelSelectComponent,
                config: {
                    label: TranslationService.Translate(this.dispatchTranslations, 'Emplacement de prise'),
                    name: 'pickLocation',
                    inputConfig: {
                        required: Boolean(this.fieldParams.needsPickLocation),
                        searchType: SelectItemTypeEnum.LOCATION,
                    },
                    errors: {
                        required: 'Vous devez sélectionner un emplacement de prise.'
                    }
                }
            }] : []),
            ...(this.fieldParams.displayDropLocation
                ? [{
                    item: FormPanelSelectComponent,
                    config: {
                        label: TranslationService.Translate(this.dispatchTranslations, 'Emplacement de dépose'),
                        name: 'dropLocation',
                        inputConfig: {
                            required: Boolean(this.fieldParams.needsDropLocation),
                            searchType: SelectItemTypeEnum.LOCATION,
                        },
                        errors: {
                            required: 'Vous devez sélectionner un emplacement de dépose.'
                        }
                    }
                }]
                : []),
            ...(this.fieldParams.displayComment ? [{
                item: FormPanelTextareaComponent,
                config: {
                    label: `Commentaire`,
                    name: 'comment',
                    inputConfig: {
                        required: Boolean(this.fieldParams.needsComment),
                        maxLength: '512',
                    },
                    errors: {
                        required: 'Le commentaire est requis.',
                    }
                }
            }] : []),
            ...(this.fieldParams.displayEmergency ? [{
                item: FormPanelSelectComponent,
                config: {
                    label: 'Urgence',
                    name: 'emergency',
                    value: null,
                    inputConfig: {
                        required: Boolean(this.fieldParams.needsEmergency),
                        elements: this.emergencies
                    },
                    errors: {
                        required: 'Vous devez sélectionner une urgence.'
                    }
                }
            }] : []),
            ...(this.fieldParams.displayReceiver ? [{
                item: FormPanelSelectComponent,
                config: {
                    label: 'Destinataire',
                    name: 'receiver',
                    inputConfig: {
                        required: Boolean(this.fieldParams.needsReceiver),
                        searchType: SelectItemTypeEnum.USER,
                        label: `username`,
                    },
                    errors: {
                        required: 'Vous devez sélectionner un destinataire.'
                    }
                }
            }] : []),
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Email(s)',
                    name: 'emails',
                    inputConfig: {
                        type: 'text',
                    }
                }
            },
        ];
    }

    public validate() {
        if (this.formPanelComponent.firstError) {
            this.toastService.presentToast(this.formPanelComponent.firstError);
        } else {
            const values = this.formPanelComponent.values;
            this.loadingService.presentLoadingWhile({
                event: () => of(undefined).pipe(
                    mergeMap(() => this.apiService.requestApi(ApiService.NEW_DISPATCH, {params: values})),
                    mergeMap(({success, msg, dispatch}) => success ? (this.sqliteService.insert(`dispatch`, dispatch) as Observable<number>) : of({success, msg})),
                    mergeMap((result: number | {success: boolean; msg: string}) => {
                        if (typeof result === `number`) {
                            return this.navService.push(NavPathEnum.DISPATCH_PACKS, {
                                dispatchId: result,
                                fromCreate: true,
                            });
                        } else {
                            return of(result.msg);
                        }
                    })
                ),
                message: `Création de l'acheminement en cours...`,
            }).subscribe((result: boolean | string) => {
                if (typeof result === 'string') {
                    this.toastService.presentToast(result);
                }
            });
        }
    }
}
