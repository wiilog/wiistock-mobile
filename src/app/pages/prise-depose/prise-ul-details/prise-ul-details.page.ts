import {Component, ViewChild} from '@angular/core';
import {FormPanelComponent} from '@common/components/panel/form-panel/form-panel.component';
import {HeaderConfig} from '@common/components/panel/model/header-config';
import {Emplacement} from '@entities/emplacement';
import {ToastService} from '@app/services/toast.service';
import {NavService} from '@app/services/nav/nav.service';
import {ActivatedRoute} from '@angular/router';
import {SelectItemTypeEnum} from '@common/components/select-item/select-item-type.enum';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {FormPanelService} from '@app/services/form-panel.service';
import {FormPanelParam} from '@common/directives/form-panel/form-panel-param';
import {FormPanelInputComponent} from '@common/components/panel/form-panel/form-panel-input/form-panel-input.component';
import {FormPanelSelectComponent} from '@common/components/panel/form-panel/form-panel-select/form-panel-select.component';
import {FormPanelSigningComponent} from '@common/components/panel/form-panel/form-panel-signing/form-panel-signing.component';
import {FormPanelCameraComponent} from '@common/components/panel/form-panel/form-panel-camera/form-panel-camera.component';
import {Nature} from '@entities/nature';
import {zip} from 'rxjs';
import {ListPanelItemConfig} from '@common/components/panel/model/list-panel/list-panel-item-config';
import {ApiService} from "@app/services/api.service";
import {LoadingService} from "@app/services/loading.service";
import {ViewWillEnter} from "@ionic/angular";
import {TranslationService} from "@app/services/translations.service";

enum Page {
    MOVEMENT,
    UL_CONTENT
}

@Component({
    selector: 'wii-prise-ul-details',
    templateUrl: './prise-ul-details.page.html',
    styleUrls: ['./prise-ul-details.page.scss'],
})
export class PriseUlDetails implements ViewWillEnter {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public headerConfig: HeaderConfig;
    public bodyConfig: Array<FormPanelParam>;
    public logisticUnitContentConfig: Array<ListPanelItemConfig>;

    public readonly Page = Page;
    public currentPage: Page = Page.MOVEMENT;

    private articlesInLU?: Array<string>;
    private savedNatureId?: string;
    private location: Emplacement;
    private validate: (values: {comment: string; signature: string; photo: string; natureId: number; projectId?: number}) => void;
    public natureIdToNature: { [natureId: string]: Nature };

    public projetTrad: string;

    public constructor(private activatedRoute: ActivatedRoute,
                       private toastService: ToastService,
                       private sqliteService: SqliteService,
                       private formPanelService: FormPanelService,
                       private apiService: ApiService,
                       private navService: NavService,
                       private loadingService: LoadingService,
                       private translationService: TranslationService) {
        this.savedNatureId = undefined;
        this.logisticUnitContentConfig = [];

        this.translationService.get(null, `Référentiel`, `Projet`).subscribe((projetTranslations) => {
            this.projetTrad = TranslationService.Translate(projetTranslations, 'Projet');
        });
    }

    public ionViewWillEnter(): void {
        this.location = this.navService.param('location');
        this.validate = this.navService.param('validate');
        const barCode = this.navService.param('barCode');
        const {comment, signature, photo, natureId, projectId} = this.navService.param('values');

        this.loadingService.presentLoadingWhile({
            event: () => this.apiService.requestApi(ApiService.LOGISTIC_UNIT_ARTICLES, {params: {code: barCode}}),
            message: 'Chargement en cours...'
        }).subscribe((articles: Array<string>) => {
            this.articlesInLU = articles;
            this.headerConfig = {
                title: `Prise de ${barCode}`,
                subtitle: this.location ? `Emplacement : ${this.location.label}` : undefined,
                leftIcon: {
                    name: 'upload.svg',
                    color: 'primary'
                },
            };

            zip(
                this.sqliteService.findAll('nature'),
            )
                .subscribe(([natures]: [Array<Nature>]) => {
                    const needsToShowNatures = natures.filter(nature => nature.hide !== 1).length > 0;

                    this.natureIdToNature = natures.reduce((acc, nature) => ({
                        ...acc,
                        [Number(nature.id)]: nature
                    }), {})

                    const selectedNature = (needsToShowNatures && natureId)
                        ? this.natureIdToNature[Number(natureId)]
                        : null;
                    this.savedNatureId = selectedNature ? String(selectedNature.id) : undefined;
                    this.bodyConfig = [];

                    if (selectedNature) {
                        this.bodyConfig.push({
                            item: FormPanelInputComponent,
                            config: {
                                label: 'Nature',
                                name: 'natureId',
                                value: selectedNature.label,
                                inputConfig: {
                                    type: 'text',
                                    disabled: true
                                }
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
                                    maxlength: 'Votre commentaire est trop long'
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
                        {
                            item: FormPanelSelectComponent,
                            config: {
                                label: this.projetTrad,
                                name: 'projectId',
                                value: projectId,
                                inputConfig: {
                                    required: false,
                                    barcodeScanner: false,
                                    searchType: SelectItemTypeEnum.PROJECT,
                                    label: 'code'
                                },
                            }
                        },
                    ]);

                    this.logisticUnitContentConfig = this.calculateLogisticUnitContentListConfig(this.articlesInLU);
                });
        });
    }

    public onFormSubmit(): void {
        const formError = this.formPanelComponent.firstError;
        if (formError) {
            this.toastService.presentToast(formError);
        }
        else {
            let {comment, signature, photo, natureId, projectId} = this.formPanelComponent.values;
            natureId = this.savedNatureId ? this.savedNatureId : natureId
            this.validate({
                comment,
                signature,
                photo,
                natureId,
                projectId,
            });
            this.navService.pop();
        }
    }

    public onPageClicked(page: Page) {
        if (this.currentPage !== page) {
            this.currentPage = page;
        }
    }

    private calculateLogisticUnitContentListConfig(articlesInLU?: Array<string>) {
        // @ts-ignore
        return articlesInLU.map(({label, quantity, reference}): ListPanelItemConfig => ({
            infos: {
                code: {
                    label: 'Objet',
                    value: label,
                },
                quantity: {
                    label: 'Quantité',
                    value: `${quantity}`,
                },
                reference: {
                    label: 'Référence',
                    value: reference
                }
            }
        }));
    }
}
