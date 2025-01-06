import {Component} from '@angular/core';
import {HeaderConfig} from "@common/components/panel/model/header-config";
import * as moment from "moment";
import {SqliteService} from "@app/services/sqlite/sqlite.service";
import {NavService} from "@app/services/nav/nav.service";
import {ListPanelItemConfig} from "@common/components/panel/model/list-panel/list-panel-item-config";
import {ApiService} from "@app/services/api.service";
import {ToastService} from "@app/services/toast.service";
import {Subscription, zip} from 'rxjs';
import {ViewWillEnter, ViewWillLeave} from '@ionic/angular';
import {LoadingService} from '@app/services/loading.service';
import {mergeMap, map} from 'rxjs/operators';
import {Translations} from "@entities/translation";
import {TranslationService} from "@app/services/translations.service";

@Component({
    selector: 'wii-ungroup-confirm',
    templateUrl: './ungroup-confirm.page.html',
    styleUrls: ['./ungroup-confirm.page.scss'],
})
export class UngroupConfirmPage implements ViewWillEnter, ViewWillLeave {

    public listConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };

    public listBoldValues: Array<string>;
    private ungroupDate: string;
    private group: any;

    private loadingSubscription?: Subscription;

    private packTranslations: Translations;

    public constructor(private apiService: ApiService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private translationService : TranslationService,
                       private sqliteService: SqliteService,
                       private navService: NavService) {
        this.ungroupDate = moment().format('DD/MM/YYYY HH:mm:ss');
        this.listBoldValues = [
            'code',
            'quantity',
            'delay',
            'limitTreatmentDate',
            'nature',
        ];
    }

    async ionViewWillEnter() {
        zip(
            this.translationService.get(`Traçabilité`, `Unités logistiques`, `Divers`)
        ).subscribe(async ([packTranslations]) => {
            this.packTranslations = packTranslations;

            this.group = this.navService.param(`group`);

            this.listConfig = {
                header: await this.createHeaderConfig(this.group),
                body: await this.createBodyConfig(this.group.packs),
            };
        });
    }

    public ionViewWillLeave() {
        this.unsubscribeLoading();
    }

    private async createHeaderConfig(group: any): Promise<HeaderConfig> {
        const nature = await this.sqliteService.findOneById(`nature`, group.natureId).toPromise();

        const subtitle = [
            `Objet : <b>${group.code}</b>`,
            `Nombre colis : ${group.packs.length}`,
            `Date/Heure : ${this.ungroupDate}`,
        ];

        if(nature) {
            subtitle.push(`Nature : ${nature.label}`);
        }

        return {
            subtitle,
            color: nature ? nature.color : '',
        };
    }

    private async createBodyConfig(packs: any): Promise<Array<ListPanelItemConfig>> {
        return await Promise.all(packs.map(async (pack: any) => {
            const nature = await this.sqliteService.findOneById(`nature`, pack.nature_id).toPromise();
            const processingTimeLabel = TranslationService.Translate(this.packTranslations, 'Délai de traitement');

            return {
                color: nature ? nature.color : '',
                infos: {
                    code: {
                        label: 'Objet',
                        value: pack.code
                    },
                    quantity: {
                        label: 'Quantité',
                        value: pack.quantity
                    },
                    ...(pack.trackingDelay
                            ? {
                                delay: {
                                    label: processingTimeLabel,
                                    value: pack.trackingDelay,
                                    color: pack.trackingDelayColor,
                                },
                                limitTreatmentDate: {
                                    label: 'Date limite de traitement',
                                    value: pack.limitTreatmentDate,
                                }
                            }
                            : {}),
                    ...(nature ? {
                        nature: {
                            label: `Nature`,
                            value: nature.label,
                        },
                    } : {}),
                },
            }
        }));
    }

    public onSubmit() {
        if (!this.loadingSubscription) {
            const options = {
                params: {
                    location: this.navService.param(`location`).id,
                    group: this.group.id,
                    date: this.ungroupDate
                }
            };

            this.loadingSubscription = this.loadingService
                .presentLoadingWhile({event: () => {
                    return this.apiService
                        .requestApi(ApiService.UNGROUP, options)
                        .pipe(
                            mergeMap((response) => this.sqliteService.update(
                                'mouvement_traca',
                                [{
                                    values: {subPacks: '[]', finished: 0},
                                    where: [`ref_article = '${this.group.code}'`]
                                }]
                            ).pipe(map(() => response))),
                            mergeMap((response) => this.sqliteService.deleteBy('mouvement_traca', [
                                `ref_article IN (${this.group.packs.map(({code}: any) => `'${code}'`).join(',')})`,
                                `finished = 0`,
                                `type = 'prise'`
                            ]).pipe(map(() => response)))
                        );
                }})
                .subscribe(
                    (response) => {
                        if (response.success) {
                            this.toastService.presentToast(response.msg);
                            this.navService.pop()
                                .pipe(mergeMap(() => this.navService.pop()))
                                .subscribe(() => this.navService.pop());
                        }
                        else {
                            this.toastService.presentToast(`Erreur lors de la synchronisation du dégroupage`);
                        }
                    },
                    () => {
                        this.unsubscribeLoading();
                    }
                );
        }
    }

    private unsubscribeLoading() {
        if (this.loadingSubscription) {
            this.loadingSubscription.unsubscribe();
            this.loadingSubscription = undefined;
        }
    }

}
