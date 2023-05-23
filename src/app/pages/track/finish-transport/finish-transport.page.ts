import {Component, ViewChild} from '@angular/core';
import {ViewWillEnter} from '@ionic/angular';
import {NavService} from '@app/services/nav/nav.service';
import {FormPanelParam} from '@common/directives/form-panel/form-panel-param';
import {TransportRoundLine} from '@entities/transport-round-line';
import {FormPanelSigningComponent} from '@common/components/panel/form-panel/form-panel-signing/form-panel-signing.component';
import {FormPanelCameraComponent} from '@common/components/panel/form-panel/form-panel-camera/form-panel-camera.component';
import {mergeMap, map, tap} from 'rxjs/operators';
import {ApiService} from '@app/services/api.service';
import {from, Observable, of, Subscription} from 'rxjs';
import {NetworkService} from '@app/services/network.service';
import {ToastService} from '@app/services/toast.service';
import {LoadingService} from '@app/services/loading.service';
import {FileService} from "@app/services/file.service";
import {PackCountComponent} from '@common/components/pack-count/pack-count.component';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {TransportCardMode} from '@common/components/transport-card/transport-card.component';
import {TransportService} from '@app/services/transport.service';
import {TransportRound} from "@entities/transport-round";
import {FormPanelTextareaComponent} from '@common/components/panel/form-panel/form-panel-textarea/form-panel-textarea.component';
import {TranslationService} from "@app/services/translations.service";

@Component({
    selector: 'wii-finish-transport',
    templateUrl: './finish-transport.page.html',
    styleUrls: ['./finish-transport.page.scss'],
})
export class FinishTransportPage implements ViewWillEnter {

    @ViewChild('packCount', {static: false})
    public packCount: PackCountComponent;

    public bodyConfig: Array<FormPanelParam>;

    private loadingElement?: HTMLIonLoadingElement;
    private apiSubscription?: Subscription;

    public transport: TransportRoundLine;
    public round: TransportRound;
    public edit: boolean = false;

    public livraisonTrad: string;

    public constructor(private networkService: NetworkService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private apiService: ApiService,
                       private navService: NavService,
                       private transportService: TransportService,
                       private fileService: FileService,
                       private translationService: TranslationService) {
    }

    public ionViewWillEnter() {
        this.transport = this.navService.param('transport');
        this.round = this.navService.param('round');
        this.edit = this.navService.param('edit');

        this.translationService.get(null, `Ordre`, `Livraison`).subscribe((ordreTranslations) => {
            this.livraisonTrad = TranslationService.Translate(ordreTranslations, 'Livraison');
        });

        this.bodyConfig = [{
            item: FormPanelTextareaComponent ,
            config: {
                label: `Commentaire`,
                name: 'comment',
                value: this.transport.comment ?? ``,
                inputConfig: {
                    type: 'text',
                    maxLength: '512',
                },
                errors: {
                    required: 'Votre commentaire est requis',
                    maxlength: 'Votre commentaire est trop long'
                }
            }
        }, {
            item: FormPanelCameraComponent,
            config: {
                label: 'Photo',
                name: 'photo',
                value: undefined,
                inputConfig: {}
            }
        }, {
            item: FormPanelSigningComponent,
            config: {
                label: 'Signature',
                name: 'signature',
                value: undefined,
                inputConfig: {}
            }
        }];
    }

    public async onFormSubmit() {
        const hasNetwork = await this.networkService.hasNetwork();
        if (hasNetwork) {
            if (this.packCount.formPanelComponent.firstError) {
                this.toastService.presentToast(this.packCount.formPanelComponent.firstError);
            }
            else if (!this.apiSubscription) {
                let {comment, photo, signature} = this.packCount.formPanelComponent.values;

                this.transport.comment = comment;

                const params = {
                    id: this.transport.id,
                    ...(comment ? {comment} : {}),
                    ...(this.transport.natures_to_collect ? {collectedPacks: JSON.stringify(this.transport.natures_to_collect)} : {}),
                    ...(photo ? {
                        photo: this.fileService.createFile(
                            photo,
                            FileService.SIGNATURE_IMAGE_EXTENSION,
                            FileService.SIGNATURE_IMAGE_TYPE,
                            "photo"
                        )
                    } : {}),
                    ...(signature ? {
                        signature: this.fileService.createFile(
                            signature,
                            FileService.SIGNATURE_IMAGE_EXTENSION,
                            FileService.SIGNATURE_IMAGE_TYPE,
                            "signature"
                        )
                    } : {}),
                };

                this.apiSubscription = this.dismissLoading()
                    .pipe(
                        mergeMap(() => this.loadingService.presentLoading(`Sauvegarde des données`)),
                        tap((loading: HTMLIonLoadingElement) => {
                            this.loadingElement = loading;
                        }),
                        mergeMap(() => this.apiService.requestApi(ApiService.FINISH_TRANSPORT, {params})),
                        mergeMap((result) => this.apiService.requestApi(ApiService.FETCH_ROUND, {
                            params: {round: this.round.id},
                        }).pipe(map((round) => [result, round]))),
                        mergeMap((res) => this.dismissLoading().pipe(map(() => res))),
                    )
                    .subscribe({
                        next: async ([{success, message}, round]) => {
                            this.transportService.treatTransport(this.round, round);

                            this.unsubscribeApi();
                            if (success) {
                                const allTransportsTreated = this.round.lines.every(({
                                                                                         failure,
                                                                                         success
                                                                                     }) => failure || success);
                                this.toastService.presentToast("Les données ont été sauvegardées");

                                if (!this.edit && this.transport.collect) {
                                     await this.navService.pop({number: allTransportsTreated ? 4 : 3});

                                    this.navService.push(NavPathEnum.TRANSPORT_SHOW, {
                                        transport: this.transport.collect,
                                        round: this.round,
                                        mode: TransportCardMode.STARTABLE,
                                    })
                                } else {
                                    const additionalPop = allTransportsTreated ? 1 : 0;
                                    this.navService.pop({number: this.edit ? 1 : (3 + additionalPop)});
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
            ? from(this.loadingElement.dismiss())
                .pipe(
                    tap(() => {
                        this.loadingElement = undefined;
                    }),
                    map(() => undefined)
                )
            : of(undefined);
    }

    private unsubscribeApi(): void {
        if (this.apiSubscription) {
            this.apiSubscription.unsubscribe();
            this.apiSubscription = undefined;
        }
    }

}
