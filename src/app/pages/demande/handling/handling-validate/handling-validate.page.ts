import {Component, ViewChild} from '@angular/core';
import {Handling} from '@database/handling';
import {ToastService} from '@app/services/toast.service';
import {ApiService} from '@app/services/api.service';
import {LoadingService} from '@app/services/loading.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {NavService} from '@app/services/nav/nav.service';
import {from, Observable, of, Subscription, zip} from 'rxjs';
import {HeaderConfig} from '@common/components/panel/model/header-config';
import {FormPanelParam} from '@common/directives/form-panel/form-panel-param';
import {HandlingAttachment} from '@database/handling-attachment';
import {FormPanelInputComponent} from '@common/components/panel/form-panel/form-panel-input/form-panel-input.component';
import {FormPanelCameraComponent} from '@common/components/panel/form-panel/form-panel-camera/form-panel-camera.component';
import {FormPanelSelectComponent} from '@common/components/panel/form-panel/form-panel-select/form-panel-select.component';
import {SelectItemTypeEnum} from '@common/components/select-item/select-item-type.enum';
import {FormPanelComponent} from '@common/components/panel/form-panel/form-panel.component';
import {FileService} from '@app/services/file.service';
import {filter, mergeMap, map, tap} from 'rxjs/operators';
import {FormViewerParam} from '@common/directives/form-viewer/form-viewer-param';
import {FormViewerAttachmentsComponent} from '@common/components/panel/form-panel/form-viewer-attachments/form-viewer-attachments.component';
import {FormPanelService} from '@app/services/form-panel.service';
import {FreeField, FreeFieldType} from '@database/free-field';
import {Translations} from '@database/translation';
import {Status} from '@database/status';
import {TranslationService} from '@app/services/translations.service';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {StorageService} from '@app/services/storage/storage.service';
import {NetworkService} from '@app/services/network.service';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";


@Component({
    selector: 'wii-handling-validate',
    templateUrl: './handling-validate.page.html',
    styleUrls: ['./handling-validate.page.scss'],
})
export class HandlingValidatePage implements ViewWillEnter, ViewWillLeave {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public headerConfig: HeaderConfig;
    public bodyConfig: Array<FormPanelParam>;
    public detailsConfig: Array<FormViewerParam>;

    private handling: Handling;
    private handlingsTranslations: Translations;

    private loadingElement?: HTMLIonLoadingElement;
    private apiSubscription?: Subscription;

    private beginDate: Date;

    private pageEnter: boolean;

    public constructor(private loadingService: LoadingService,
                       private networkService: NetworkService,
                       private apiService: ApiService,
                       private toastService: ToastService,
                       private sqliteService: SqliteService,
                       private fileService: FileService,
                       private formPanelService: FormPanelService,
                       private translationService: TranslationService,
                       private storageService: StorageService,
                       private navService: NavService) {
        this.pageEnter = false;
    }

    public ionViewWillEnter(): void {
        this.pageEnter = true;
        this.handling = this.navService.param('handling');
        this.beginDate = new Date();

        this.refreshView();
    }

    public ionViewWillLeave(): void {
        this.pageEnter = false;
        if (this.apiSubscription) {
            this.apiSubscription.unsubscribe();
            this.apiSubscription = undefined;
        }
    }

    public refreshView() {
        this.loadingService.presentLoadingWhile({
            event: () => zip(
                this.sqliteService.findOneBy('handling', {id: this.handling.id}),
                this.handling.statusId ? this.sqliteService.findOneBy('status', {id: this.handling.statusId}) : of(undefined),
                this.sqliteService.findBy('handling_attachment', [`handlingId = ${this.handling.id}`]),
                this.sqliteService.findBy('free_field', [`categoryType = '${FreeFieldType.HANDLING}'`]),
                this.translationService.get(null, `Demande`, `Services`),
            ),
        }).subscribe(([handling, currentStatus, handlingAttachment, freeFields, handlingsTranslations]: [Handling, Status, Array<HandlingAttachment>, Array<FreeField>, Translations]) => {
            this.dismissLoading();
            this.handlingsTranslations = handlingsTranslations;

            this.refreshHeader(false);

            this.handling = handling;
            let freeFieldsValues = JSON.parse(this.handling.freeFields || '{}') || {};

            const sAttachmentLabel = handlingAttachment.length > 1 ? 's' : '';
            this.detailsConfig = handlingAttachment.length > 0
                ? [
                    {
                        item: FormViewerAttachmentsComponent,
                        config: {
                            label: `Pièce${sAttachmentLabel} jointe${sAttachmentLabel}`,
                            value: handlingAttachment.map(({fileName, href}) => ({
                                label: fileName,
                                href
                            }))
                        }
                    }
                ]
                : [];

            this.bodyConfig = [
                {
                    item: FormPanelSelectComponent,
                    config: {
                        label: 'Statut',
                        name: 'statusId',
                        value: this.handling.statusId,
                        inputConfig: {
                            required: true,
                            searchType: SelectItemTypeEnum.STATUS,
                            requestParams: [
                                `category = 'service'`,
                                `state = 'treated' OR state = 'inProgress'`,
                                `typeId = ${this.handling.typeId}`,
                            ],
                            filterItem: (status) => Number(status.id) !== Number(this.handling.statusId),
                            onChange: (statusId: any) => {
                                this.handling.statusId = statusId;
                                this.sqliteService
                                    .findOneBy('status', {id: statusId})
                                    .pipe(filter(() => this.pageEnter))
                                    .subscribe((newStatus?: Status) => {
                                        this.updateFormConfig(newStatus);
                                    })
                            }
                        },
                        errors: {
                            required: 'Le statut de la demande est requis',
                        }
                    }
                },
                {
                    item: FormPanelInputComponent,
                    config: {
                        label: 'Commentaire',
                        name: 'comment',
                        inputConfig: {
                            type: 'text',
                            maxLength: '255',
                            required: !currentStatus || Boolean(currentStatus.commentNeeded)
                        },
                        errors: {
                            required: 'Votre commentaire est requis',
                            maxlength: 'Votre commentaire est trop long'
                        }
                    }
                },
                {
                    item: FormPanelCameraComponent,
                    config: {
                        label: 'Photo(s)',
                        name: 'photos',
                        inputConfig: {
                            multiple: true
                        }
                    }
                },

                ...(freeFields
                    .filter(({typeId}) => (typeId === this.handling.typeId))
                    .map(({id, ...freeField}) => (
                        this.formPanelService.createConfigFromFreeField(
                            {id, ...freeField},
                            freeFieldsValues[freeField.freeFieldId],
                            'freeFields',
                            'edit'
                        )
                    ))
                    .filter(Boolean) as Array<FormPanelParam>)
            ];
        });
    }

    public async onFormSubmit() {
        const hasNetwork = await this.networkService.hasNetwork();
        if (hasNetwork) {
            if (this.formPanelComponent.firstError) {
                this.toastService.presentToast(this.formPanelComponent.firstError);
            }
            else if (!this.apiSubscription) {
                const {statusId, comment, photos, freeFields} = this.formPanelComponent.values

                const endDate = new Date();
                const freeFieldValues = JSON.stringify(freeFields || {});

                const params = {
                    id: this.handling.id,
                    statusId,
                    freeFields: freeFieldValues,
                    treatmentDelay: Math.floor((endDate.getTime() - this.beginDate.getTime()) / 1000),
                    ...(
                        photos && photos.length
                            ? photos.reduce((acc: { [name: string]: File}, photoBase64: string, index: number) => {
                                const name = `photo_${index + 1}`;
                                return ({
                                    ...acc,
                                    [name]: this.fileService.createFile(
                                        photoBase64,
                                        FileService.SIGNATURE_IMAGE_EXTENSION,
                                        FileService.SIGNATURE_IMAGE_TYPE,
                                        name
                                    )
                                })
                            }, {})
                            : {}
                    )
                };

                if(comment) {
                    params.comment = comment;
                }

                this.apiSubscription = this.dismissLoading()
                    .pipe(
                        mergeMap(() => this.loadingService.presentLoading('Sauvegarde de la demande de service...')),
                        tap((loading: HTMLIonLoadingElement) => {
                            this.loadingElement = loading;
                        }),
                        mergeMap(() => this.apiService.requestApi(ApiService.POST_HANDLING, {params})),
                        mergeMap((res) => {
                            if (res && res.success) {
                                if (res.state !== 'inProgress') {
                                    return zip(
                                        this.sqliteService.deleteBy('handling', [`id = ${this.handling.id}`]),
                                        this.sqliteService.deleteBy('handling_attachment', [`handlingId = ${this.handling.id}`]),
                                        this.storageService.incrementCounter(StorageKeyEnum.COUNTERS_HANDLINGS_TREATED)
                                    ).pipe(map(() => res));
                                }
                                else {
                                    return zip(
                                        this.sqliteService.update('handling', [{values: {statusId, comment, freeFields: freeFieldValues}, where: [`id = ${this.handling.id}`]}]),
                                        ...res.addedAttachments.map(({name, href}: any) => this.sqliteService.insert(`handling_attachment`, {
                                            fileName: name,
                                            href,
                                            handlingId: this.handling.id,
                                        }))
                                    ).pipe(map(() => res));
                                }
                            }
                            else {
                                return of(res);
                            }
                        }),
                        mergeMap((res) => this.dismissLoading().pipe(map(() => res))),

                    )
                    .subscribe({
                        next: ({success, message, state}) => {
                            this.unsubscribeApi();
                            if (success) {
                                if (state === 'inProgress') {
                                    this.refreshView();
                                    this.toastService.presentToast("Le changement de statut a bien été pris en compte.");
                                } else {
                                    this.navService.pop();
                                    this.toastService.presentToast("La demande de service a bien été traitée.");
                                }
                            } else {
                                this.toastService.presentToast(message || "Une erreur s'est produite.");
                            }
                        },
                        error: () => {
                            this.unsubscribeApi();
                            this.dismissLoading();
                            this.toastService.presentToast("Une erreur s'est produite.");
                        }
                    });
            }
        }
        else {
            this.toastService.presentToast('Vous devez être connecté à internet pour valider la demande.');
        }
    }

    public dismissLoading(): Observable<void> {
        return this.loadingElement
            ? from(this.loadingElement.dismiss()).pipe(
                tap(() => {
                    this.loadingElement = undefined;
                }),
                map(() => undefined)
            )
            : of(undefined);
    }

    public refreshHeader(opened: boolean = false) {
        const {
            number,
            requester,
            desiredDate,
            subject,
            carriedOutOperationCount,
            source,
            destination,
            typeLabel,
            comment,
            emergency,
            color
        } = this.handling;
        this.headerConfig = {
            title: `Demande ${number}`,
            collapsed: true,
            onToggle: (opened) => {
                this.refreshHeader(opened);
            },
            leftIcon: {
                color: 'success',
                name: 'people.svg',
                customColor: color
            },
            rightIcon: {
                name: opened ? 'double-arrow-up.svg' : 'double-arrow-down.svg',
                color: 'dark',
                width: '26px',
                action: () => {
                    this.formPanelComponent.formHeaderComponent.toggleTitle();
                }
            },
            subtitle: [
                `Demandeur : ${requester || ''}`,
                `Date attendue : ${desiredDate || ''}`,
                `${TranslationService.Translate(this.handlingsTranslations, 'Objet')} : ${subject || ''}`,
                `${TranslationService.Translate(this.handlingsTranslations,'Nombre d\'opération(s) réalisée(s)')} : ${carriedOutOperationCount || ''}`,
                `Source : ${source || ''}`,
                `Destination : ${destination || ''}`,
                `Type : ${typeLabel || ''}`,
                `Commentaire : ${comment || ''}`,
                emergency ? `Urgence : ${emergency || ''}` : undefined
            ].filter((item) => item) as Array<string>
        };
    }

    private unsubscribeApi(): void {
        if (this.apiSubscription) {
            this.apiSubscription.unsubscribe();
            this.apiSubscription = undefined;
        }
    }

    private updateFormConfig(status?: Status) {
        const commentNeeded = !status || Boolean(status.commentNeeded);
        this.formPanelComponent.updateConfigField('comment', {
            required: commentNeeded
        });
    }
}
