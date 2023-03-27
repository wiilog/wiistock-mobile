import {Component, ViewChild} from '@angular/core';
import {IconConfig} from '@common/components/panel/model/icon-config';
import {ViewWillEnter, ViewWillLeave} from '@ionic/angular';
import {NavService} from '@app/services/nav/nav.service';
import {Emplacement} from '@entities/emplacement';
import {FormPanelParam} from '@common/directives/form-panel/form-panel-param';
import {FormPanelInputComponent} from '@common/components/panel/form-panel/form-panel-input/form-panel-input.component';
import {ApiService} from '@app/services/api.service';
import {FormPanelComponent} from '@common/components/panel/form-panel/form-panel.component';
import {LoadingService} from '@app/services/loading.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {ToastService} from '@app/services/toast.service';
import * as moment from 'moment';
import {NetworkService} from '@app/services/network.service';
import {tap} from "rxjs";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";

@Component({
    selector: 'wii-empty-round',
    templateUrl: './empty-round.page.html',
    styleUrls: ['./empty-round.page.scss'],
})
export class EmptyRoundPage implements ViewWillEnter, ViewWillLeave {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public emptyRoundHeader: {
        title: string;
        subtitle?: string;
        rightIcon: IconConfig;
    };

    public formBodyConfig: Array<FormPanelParam>;

    public location: Emplacement;

    constructor(private navService: NavService,
                private api: ApiService,
                private loading: LoadingService,
                private networkService: NetworkService,
                private localDataManager: LocalDataManagerService,
                private sqliteService: SqliteService,
                private toast: ToastService) {
    }

    public ionViewWillEnter() {
        this.location = this.navService.param(`emplacement`);
        this.emptyRoundHeader = {
            title: 'Passage à vide sur',
            subtitle: this.location.label,
            rightIcon: {
                name: 'check.svg',
                color: 'success',
                action: () => {
                    this.validate()
                }
            },
        };

        this.formBodyConfig = [{
            item: FormPanelInputComponent,
            config: {
                label: 'Commentaire',
                name: 'comment',
                inputConfig: {
                    type: 'text',
                    disabled: false
                }
            }
        }];
    }

    ionViewWillLeave(): void {
    }

    public async validate() {
        const values = this.formPanelComponent.values;
        const online = await this.networkService.hasNetwork();

        const params = {
            location: this.location.label,
            comment: values.comment,
            date: moment().format('DD/MM/YYYY HH:mm:ss')
        }

        this.loading
            .presentLoadingWhile({
                message: `${online ? 'Envoi' : 'Sauvegarde'} du mouvement de passage à vide`,
                event: () => {
                    if(online) {
                        return this.api.requestApi(ApiService.POST_EMPTY_ROUND, {params})
                            .pipe(tap({
                                error: () => {
                                    this.toast.presentToast('Une erreur est survenue lors de l\'envoi des données');
                                }
                            }));
                    } else {
                        return this.sqliteService.insert('empty_round', params);
                    }
                }
            })
            .subscribe(() => {
                this.navService.pop({path: NavPathEnum.TRACKING_MOVEMENT_MENU});
            })
    }
}
