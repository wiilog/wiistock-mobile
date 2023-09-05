import {Component, ViewChild} from '@angular/core';
import {NavService} from '@app/services/nav/nav.service';
import {ApiService} from '@app/services/api.service';
import {LoadingService} from '@app/services/loading.service';
import {TransportRoundLine} from '@entities/transport-round-line';
import {
    FormPanelSelectComponent
} from '@common/components/panel/form-panel/form-panel-select/form-panel-select.component';
import {FormPanelParam} from '@common/directives/form-panel/form-panel-param';
import {FormViewerParam} from '@common/directives/form-viewer/form-viewer-param';
import {FormPanelComponent} from '@common/components/panel/form-panel/form-panel.component';
import {ToastService} from '@app/services/toast.service';
import {
    FormPanelCameraComponent
} from '@common/components/panel/form-panel/form-panel-camera/form-panel-camera.component';
import {
    FormPanelTextareaComponent
} from '@common/components/panel/form-panel/form-panel-textarea/form-panel-textarea.component';
import {HeaderConfig} from '@common/components/panel/model/header-config';
import {FileService} from '@app/services/file.service';
import {mergeMap, map} from 'rxjs/operators';
import {TransportService} from '@app/services/transport.service';
import {TransportRound} from "@entities/transport-round";
import {ViewWillEnter} from "@ionic/angular";
import {TranslationService} from "@app/services/translations.service";

@Component({
    selector: 'wii-transport-failure',
    templateUrl: './transport-failure.page.html',
    styleUrls: ['./transport-failure.page.scss'],
})
export class TransportFailurePage implements ViewWillEnter {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public bodyConfig: Array<FormPanelParam>;
    public detailsConfig: Array<FormViewerParam>;
    public headerConfig: HeaderConfig;

    private deliveryRejectMotives: Array<any>;
    private collectRejectMotives: Array<any>;
    public transport: TransportRoundLine;
    public round: TransportRound;

    public edit: boolean = false;

    public deliveryOrderTranslation: string;

    constructor(private apiService: ApiService,
                private loadingService: LoadingService,
                private toastService: ToastService,
                private fileService: FileService,
                private transportService: TransportService,
                private navService: NavService) {
    }

    public ionViewWillEnter(): void {
        this.edit = this.navService.param('edit');

        this.loadingService.presentLoadingWhile({
            event: () => this.apiService.requestApi(ApiService.GET_REJECT_MOTIVES)
        }).subscribe(({delivery, collect}: { delivery: Array<string>; collect: Array<string> }) => {
            this.deliveryRejectMotives = delivery;
            this.collectRejectMotives = collect;
            this.transport = this.navService.param('transport');
            this.round = this.navService.param('round');

            const motives = this.transport.kind === 'collect'
                ? this.collectRejectMotives
                : this.deliveryRejectMotives;

            const kind = this.transport.kind === 'collect' ? 'Collecte' : this.deliveryOrderTranslation
            this.headerConfig = {
                title: `${kind} impossible`,
                leftIcon: {
                    name: `canceled-${this.transport.kind}.svg`,
                }
            };

            this.bodyConfig = [
                {
                    item: FormPanelSelectComponent,
                    config: {
                        label: 'Motif',
                        name: 'motive',
                        value: this.transport.reject_motive || '',
                        inputConfig: {
                            required: true,
                            elements: motives.map((label) => ({id: label, label}))
                        },
                        errors: {
                            required: 'Vous devez sélectionner un motif',
                        }
                    },
                },
                {
                    item: FormPanelTextareaComponent,
                    config: {
                        label: `Commentaire`,
                        name: 'comment',
                        value: this.transport.comment || '',
                        inputConfig: {
                            required: false,
                            maxLength: '512',
                        },
                        errors: {
                            required: 'Le commentaire est requis',
                        }
                    }
                },
                {
                    item: FormPanelCameraComponent,
                    config: {
                        label: 'Photo',
                        name: 'photo',
                        inputConfig: {
                            multiple: false
                        }
                    }
                },
            ];
        });
    }

    public onFormSubmit(): void {
        if (this.formPanelComponent.firstError) {
            this.toastService.presentToast(this.formPanelComponent.firstError);
        } else {
            const {motive, comment, photo} = this.formPanelComponent.values;

            const params = {
                transport: this.transport.id,
                round: this.round.id,
                motive,
                comment,
                ...({
                    photo: (photo ? this.fileService.createFile(
                            photo,
                            FileService.SIGNATURE_IMAGE_EXTENSION,
                            FileService.SIGNATURE_IMAGE_TYPE,
                            'photo')
                        : undefined),
                }),
            };

            this.loadingService.presentLoadingWhile({
                event: () => this.apiService.requestApi(ApiService.TRANSPORT_FAILURE, {params})
                    .pipe(
                        mergeMap((result) => this.apiService.requestApi(ApiService.FETCH_ROUND, {
                            params: {round: this.round.id},
                        }).pipe(map((round) => [result, round]))),
                    )
            }).subscribe(async ([result, round]) => {
                this.transportService.treatTransport(this.round, round);

                if (result.success) {
                    const allTransportsTreated = this.round.lines.every(({failure, success}) => failure || success);
                    this.toastService.presentToast("Les données ont été sauvegardées");

                    const additionalPop = allTransportsTreated ? 1 : 0;
                    this.navService.pop({number: this.edit ? 1 : (2 + additionalPop)});
                }
            });
        }
    }
}
