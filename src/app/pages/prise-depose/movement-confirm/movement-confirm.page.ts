import {Component, ViewChild} from '@angular/core';
import {FormPanelComponent} from '@common/components/panel/form-panel/form-panel.component';
import {HeaderConfig} from '@common/components/panel/model/header-config';
import {Emplacement} from '@entities/emplacement';
import {ToastService} from '@app/services/toast.service';
import {NavService} from '@app/services/nav/nav.service';
import {SelectItemTypeEnum} from '@common/components/select-item/select-item-type.enum';
import {FreeField, FreeFieldType} from '@entities/free-field';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {FormPanelService} from '@app/services/form-panel.service';
import {FormPanelParam} from '@common/directives/form-panel/form-panel-param';
import {FormPanelInputComponent} from '@common/components/panel/form-panel/form-panel-input/form-panel-input.component';
import {
    FormPanelSelectComponent
} from '@common/components/panel/form-panel/form-panel-select/form-panel-select.component';
import {
    FormPanelSigningComponent
} from '@common/components/panel/form-panel/form-panel-signing/form-panel-signing.component';
import {
    FormPanelCameraComponent
} from '@common/components/panel/form-panel/form-panel-camera/form-panel-camera.component';
import {Nature} from '@entities/nature';
import {zip} from 'rxjs';
import {MovementConfirmType} from '@pages/prise-depose/movement-confirm/movement-confirm-type';
import {IconColor} from '@common/components/icon/icon-color';
import {ListPanelItemConfig} from '@common/components/panel/model/list-panel/list-panel-item-config';
import {MouvementTraca} from '@entities/mouvement-traca';
import {ViewWillEnter} from "@ionic/angular";
import {Translations} from "@entities/translation";
import {TranslationService} from "@app/services/translations.service";
import {LoadingService} from "@app/services/loading.service";
import {
    FormPanelCalendarComponent
} from "@common/components/panel/form-panel/form-panel-calendar/form-panel-calendar.component";
import {FormPanelCalendarMode} from "@common/components/panel/form-panel/form-panel-calendar/form-panel-calendar-mode";
import {StorageKeyEnum} from "@app/services/storage/storage-key.enum";
import {StorageService} from "@app/services/storage/storage.service";

enum Page {
    EDIT,
    SUB_PACKS
}

@Component({
    selector: 'wii-movement-confirm',
    templateUrl: './movement-confirm.page.html',
    styleUrls: ['./movement-confirm.page.scss'],
})
export class MovementConfirmPage implements ViewWillEnter {

    private static readonly PageIcon = {
        [MovementConfirmType.DROP]: {icon: 'download.svg', color: 'success' as IconColor},
        [MovementConfirmType.TAKE]: {icon: 'upload.svg', color: 'primary' as IconColor},
        [MovementConfirmType.GROUP]: {icon: 'group.svg', color: 'primary' as IconColor},
        [MovementConfirmType.PICK_AND_DROP]: {icon: 'pick-and-drop.svg', color: 'primary' as IconColor},
    }
    private static readonly PageTitle = {
        [MovementConfirmType.DROP]: 'Dépose',
        [MovementConfirmType.TAKE]: 'Prise',
        [MovementConfirmType.GROUP]: 'Groupage',
        [MovementConfirmType.PICK_AND_DROP]: 'Prise et dépose',
    }

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public headerConfig: HeaderConfig;
    public bodyConfig: Array<FormPanelParam>;
    public subPacksConfig: Array<ListPanelItemConfig>;

    public readonly Page = Page;
    public currentPage: Page = Page.EDIT;

    private savedNatureId: string | null;
    private location: Emplacement;
    private validate: (values: {
        quantity: string;
        comment: string;
        signature: string;
        photo: string;
        natureId: number,
        freeFields: string,
        subPacks?: any,
        manualDelayStart?: string,
    }) => void;

    public isGroup: boolean;
    public subPacks: Array<MouvementTraca>;
    public natureIdToNature: { [natureId: string]: Nature };
    public natureTranslationLabel: string;
    public fromStock: boolean;
    public movementType: MovementConfirmType;
    private group?: any;

    public constructor(private toastService: ToastService,
                       private sqliteService: SqliteService,
                       private formPanelService: FormPanelService,
                       private translationService: TranslationService,
                       private storageService: StorageService,
                       private loadingService: LoadingService,
                       private navService: NavService) {
        this.savedNatureId = null;
        this.subPacksConfig = [];
    }

    public ionViewWillEnter(): void {
        this.location = this.navService.param('location');
        this.group = this.navService.param('group');
        this.validate = this.navService.param('validate');
        this.isGroup = this.navService.param('isGroup');
        this.subPacks = this.navService.param('subPacks');
        this.movementType = this.navService.param('movementType');

        const barcode = this.navService.param('barcode');
        const fromStock = this.navService.param('fromStock');
        const {
            quantity,
            comment,
            signature,
            photo,
            natureId,
            freeFields: freeFieldsValuesStr,
            manualDelayStart,
        } = this.navService.param('values');
        const freeFieldsValues = freeFieldsValuesStr ? JSON.parse(freeFieldsValuesStr) : {};
        const chosenIcon = MovementConfirmPage.PageIcon[this.movementType];
        const chosenTitle = MovementConfirmPage.PageTitle[this.movementType];

        this.headerConfig = {
            title: `${chosenTitle} de ${barcode}`,
            subtitle: this.location ?
                `Emplacement : ${this.location.label}`
                : (this.group
                    ? `Groupe : ${this.group.code}`
                    : ``),
            leftIcon: {
                name: chosenIcon.icon,
                color: chosenIcon.color
            }
        };

        this.loadingService
            .presentLoadingWhile({
                event: () => zip(
                    this.sqliteService.findAll('nature'),
                    this.sqliteService.findBy('free_field', [`categoryType = '${FreeFieldType.TRACKING}'`]),
                    this.translationService.get(null, `Traçabilité`, `Général`),
                    this.storageService.getRight(StorageKeyEnum.PARAMETER_DISPLAY_MANUAL_DELAY_START)
                ),
                message: 'Chargement...'
            })
            .subscribe(([natures, freeFields, natureTranslation, displayManualDelayStart]: [Array<Nature>, Array<FreeField>, Translations, boolean]) => {
                const needsToShowNatures = natures.filter(nature => nature.hide !== 1).length > 0;

                this.natureIdToNature = natures.reduce((acc, nature) => ({
                    ...acc,
                    [Number(nature.id)]: nature
                }), {})

                this.natureTranslationLabel = TranslationService.Translate(natureTranslation, 'Nature');

                const selectedNature = (needsToShowNatures && natureId)
                    ? this.natureIdToNature[Number(natureId)]
                    : null;
                this.savedNatureId = selectedNature ? String(selectedNature.id) : null;
                this.bodyConfig = [];


                this.bodyConfig.push({
                    item: FormPanelSelectComponent,
                    config: {
                        label: this.natureTranslationLabel,
                        name: 'natureId',
                        value: selectedNature ? selectedNature.id : natureId,
                        inputConfig: {
                            required: false,
                            searchType: SelectItemTypeEnum.TRACKING_NATURES,
                            filterItem: (nature: Nature) => (!nature.hide)
                        }
                    }
                });


                if (!fromStock && !this.isGroup) {
                    this.bodyConfig.push({
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Quantité',
                            name: 'quantity',
                            value: quantity,
                            inputConfig: {
                                type: 'number',
                                min: 1
                            },
                            errors: {
                                required: 'La quantité est requise',
                                min: 'La quantité doit être supérieure à 1'
                            }
                        }
                    });
                }

                if(displayManualDelayStart) {
                    this.bodyConfig.push({
                        item: FormPanelCalendarComponent,
                        config: {
                            label: 'Début de délai manuel',
                            value: manualDelayStart ?? null,
                            name: 'manualDelayStart',
                            inputConfig: {
                                mode: FormPanelCalendarMode.DATETIME,
                            },
                        }
                    });
                }

                this.bodyConfig = this.bodyConfig.concat([
                    {
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Commentaire',
                            name: 'comment',
                            value: comment,
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
                        item: FormPanelSigningComponent,
                        config: {
                            label: 'Signature',
                            name: 'signature',
                            value: signature,
                            inputConfig: {}
                        }
                    },
                    {
                        item: FormPanelCameraComponent,
                        config: {
                            label: 'Photo',
                            name: 'photo',
                            value: photo,
                            inputConfig: {}
                        }
                    },
                    ...(freeFields
                        .map(({id, ...freeField}) => (
                            this.formPanelService.createConfigFromFreeField(
                                {id, ...freeField},
                                freeFieldsValues[freeField.freeFieldId],
                                'freeFields',
                                'create'
                            )
                        ))
                        .filter(Boolean) as Array<FormPanelParam>)
                ]);

                if (this.isGroup) {
                    this.subPacksConfig = this.calculateSubPacksListConfig();
                }
            });
    }

    public onFormSubmit(): void {
        const formError = this.formPanelComponent.firstError;
        if (formError) {
            this.toastService.presentToast(formError);
        } else {
            let {quantity, comment, signature, photo, natureId, freeFields, manualDelayStart} = this.formPanelComponent.values;
            if (freeFields) {
                Object.keys(freeFields).forEach((freeFieldId) => {
                    let freeField = freeFields[freeFieldId];
                    if (Array.isArray(freeField)) {
                        if (freeField[0].id === "") {
                            freeField = null;
                        } else {
                            freeField = freeField.map(({id}) => id).join(',')
                        }
                    }
                    freeFields[freeFieldId] = freeField;
                });
            }
            this.validate({
                quantity,
                comment,
                signature,
                photo,
                natureId,
                freeFields: JSON.stringify(freeFields),
                subPacks: this.subPacks,
                manualDelayStart,
            });
            this.navService.pop();
        }
    }

    public onPageClicked(page: Page) {
        if (this.currentPage !== page) {
            this.currentPage = page;
        }
    }

    private calculateSubPacksListConfig() {
        return this.subPacks.map(({nature_id, ref_article, quantity, comment, signature, photo, freeFields}): ListPanelItemConfig => ({
            color: nature_id && this.natureIdToNature[nature_id] ? this.natureIdToNature[nature_id].color : undefined,
            infos: {
                code: {
                    label: 'Code',
                    value: ref_article,
                },
                quantity: {
                    label: 'Quantité',
                    value: `${quantity}`,
                },
                ...(nature_id && this.natureIdToNature[nature_id]
                    ? {
                        nature: {
                            label: this.natureTranslationLabel,
                            value: this.natureIdToNature[nature_id].label
                        }
                    }
                    : {})
            }
        }));
    }
}
