import {Component, ViewChild} from '@angular/core';
import {NavService} from '@app/services/nav/nav.service';
import {FormPanelComponent} from "@common/components/panel/form-panel/form-panel.component";
import {FormPanelParam} from "@common/directives/form-panel/form-panel-param";
import {
    FormPanelInputComponent
} from "@common/components/panel/form-panel/form-panel-input/form-panel-input.component";
import {ApiService} from "@app/services/api.service";
import {LoadingService} from "@app/services/loading.service";
import {
    FormPanelCalendarComponent
} from "@common/components/panel/form-panel/form-panel-calendar/form-panel-calendar.component";
import {
    FormPanelCalendarMode
} from "@common/components/panel/form-panel/form-panel-calendar/form-panel-calendar-mode";
import {StorageService} from "@app/services/storage/storage.service";
import {ToastService} from "@app/services/toast.service";
import {
    FormPanelTextareaComponent
} from "@common/components/panel/form-panel/form-panel-textarea/form-panel-textarea.component";
import {ViewWillEnter} from "@ionic/angular";
import {StorageKeyEnum} from "@app/services/storage/storage-key.enum";
import {SqliteService} from "@app/services/sqlite/sqlite.service";
import {map, mergeMap} from "rxjs/operators";
import {Observable, of} from "rxjs";

@Component({
    selector: 'wii-dispatch-packs',
    templateUrl: './dispatch-waybill.page.html',
    styleUrls: ['./dispatch-waybill.page.scss'],
})
export class DispatchWaybillPage implements ViewWillEnter {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public bodyConfig: Array<FormPanelParam>;

    public afterValidate: (data: any) => void;
    public data: any = {};

    private offlineMode: boolean;
    private dispatchLocalId: number;

    public constructor(private navService: NavService,
                       public apiService: ApiService,
                       public loadingService: LoadingService,
                       public sqliteService: SqliteService,
                       public storageService: StorageService,
                       private toastService: ToastService) {
    }

    public ionViewWillEnter(): void {
        this.afterValidate = this.navService.param('afterValidate');
        this.data = this.navService.param('data');
        this.dispatchLocalId = this.navService.param('dispatchLocalId');

        this.loadingService.presentLoadingWhile({
            event: () => this.storageService.getRight(StorageKeyEnum.DISPATCH_OFFLINE_MODE)
        }).subscribe((offlineMode) => {
            this.offlineMode = offlineMode;
            this.initializeForm();
        })
    }

    public validate(): void {
        if(this.formPanelComponent.firstError) {
            this.toastService.presentToast(this.formPanelComponent.firstError);
        } else {
            const values = this.formPanelComponent.values;
            this.loadingService
                .presentLoadingWhile({
                    event: () => this.saveWaybillData(values).pipe(
                        mergeMap(() => this.navService.pop()),
                        mergeMap(() => this.toastValidateMessage()),
                    )
                })
                .subscribe(() => {
                    this.afterValidate(values);
                })
        }
    }

    private initializeForm(): void {
        this.bodyConfig = [
            {
                item: FormPanelTextareaComponent,
                config: {
                    label: 'Transporteur',
                    name: 'carrier',
                    value: this.data?.carrier || null,
                    inputConfig: {
                        type: 'text',
                        required: true,
                    },
                    errors: {
                        required: `Vous devez renseigner un transporteur.`
                    }
                }
            },
            {
                item: FormPanelTextareaComponent,
                config: {
                    label: 'Expéditeur',
                    value: this.data?.consignor || null,
                    name: 'consignor',
                    inputConfig: {
                        type: 'text',
                        required: true,
                    },
                    errors: {
                        required: `Vous devez renseigner un expéditeur.`
                    }
                }
            },
            {
                item: FormPanelTextareaComponent,
                config: {
                    label: 'Destinataire',
                    value: this.data?.receiver || null,
                    name: 'receiver',
                    inputConfig: {
                        type: 'text',
                        required: true,
                    },
                    errors: {
                        required: `Vous devez renseigner un destinataire.`
                    }
                }
            },
            {
                item: FormPanelCalendarComponent,
                config: {
                    label: 'Date d\'acheminement',
                    value: this.data?.dispatchDate || null,
                    name: 'dispatchDate',
                    inputConfig: {
                        mode: FormPanelCalendarMode.DATETIME,
                        required: true,
                    },
                    errors: {
                        required: `Vous devez renseigner une date d'acheminement.`
                    }
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Expéditeur - Nom',
                    value: this.data?.consignorUsername || null,
                    name: 'consignorUsername',
                    inputConfig: {
                        type: 'text',
                        required: true,
                    },
                    errors: {
                        required: `Vous devez renseigner le champ Expéditeur - Nom.`
                    }
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Expéditeur - Téléphone - Email',
                    value: this.data?.consignorEmail || null,
                    name: 'consignorEmail',
                    inputConfig: {
                        type: 'text',
                        required: true,
                    },
                    errors: {
                        required: `Vous devez renseigner le champ Expéditeur - Téléphone - Email.`
                    }
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Destinataire - Nom',
                    value: this.data?.receiverUsername || null,
                    name: 'receiverUsername',
                    inputConfig: {
                        type: 'text',
                        required: true,
                    },
                    errors: {
                        required: `Vous devez renseigner le champ Destinataire - Nom.`
                    }
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Destinataire - Téléphone - Email',
                    value: this.data?.receiverEmail || null,
                    name: 'receiverEmail',
                    inputConfig: {
                        type: 'text',
                        required: true,
                    },
                    errors: {
                        required: `Vous devez renseigner le champ Destinataire - Téléphone - Email.`
                    }
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Lieu de chargement',
                    value: this.data?.locationFrom || null,
                    name: 'locationFrom',
                    inputConfig: {
                        type: 'text',
                        required: true,
                    },
                    errors: {
                        required: `Vous devez renseigner un lieu de chargement.`
                    }
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Lieu de déchargement',
                    value: this.data?.locationTo || null,
                    name: 'locationTo',
                    inputConfig: {
                        type: 'text',
                        required: true,
                    },
                    errors: {
                        required: `Vous devez renseigner un lieu de déchargement.`
                    }
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Note de bas de page',
                    value: this.data?.notes || null,
                    name: 'notes',
                    inputConfig: {
                        type: 'text',
                        required: true,
                    },
                    errors: {
                        required: `Vous devez renseigner une note de bas de page.`
                    }
                }
            },
        ];
    }

    private saveWaybillData(data: any): Observable<void> {
        if (this.offlineMode) {
            return this.sqliteService.findOneBy('dispatch_waybill', {localId: this.dispatchLocalId}).pipe(
                mergeMap((dispatchWaybill) => (
                    dispatchWaybill
                        ? this.sqliteService.update('dispatch_waybill', [{
                            values: data,
                            where: [`localId = ${this.dispatchLocalId}`],
                        }])
                        : this.sqliteService.insert('dispatch_waybill', {
                            localId: this.dispatchLocalId as number,
                            ...data
                        })
                )),
                map(() => undefined)
            );
        }
        else {
            return of(undefined);
        }
    }

    private toastValidateMessage(): Observable<void> {
        if (this.offlineMode) {
            return this.toastService.presentToast(`La lettre de voiture a bien été enregistrée et sera générée au moment de la synchronisation`);
        }
        else {
            return this.toastService.presentToast(`La lettre de voiture est prête à être générée. Validez la demande pour procéder au téléchargement.`);
        }
    }
}
