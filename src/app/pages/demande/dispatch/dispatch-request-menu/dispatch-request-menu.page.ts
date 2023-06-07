import {Component} from '@angular/core';
import {CardListColorEnum} from '@common/components/card-list/card-list-color.enum';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {CardListConfig} from '@common/components/card-list/card-list-config';
import {StorageService} from '@app/services/storage/storage.service';
import {MainHeaderService} from '@app/services/main-header.service';
import {NavService} from '@app/services/nav/nav.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {ToastService} from '@app/services/toast.service';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {LoadingService} from '@app/services/loading.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {AlertService} from '@app/services/alert.service';
import {NetworkService} from '@app/services/network.service';
import {Dispatch} from "@entities/dispatch";
import {TranslationService} from "@app/services/translations.service";
import {Translations} from "@entities/translation";
import {mergeMap, zip} from "rxjs";
import {ViewWillEnter} from "@ionic/angular";
import {StorageKeyEnum} from "@app/services/storage/storage-key.enum";
import {FormatService} from "@app/services/format.service";
import * as moment from "moment";


@Component({
    selector: 'wii-dispatch-request-menu',
    templateUrl: './dispatch-request-menu.page.html',
    styleUrls: ['./dispatch-request-menu.page.scss'],
})
export class DispatchRequestMenuPage implements ViewWillEnter, CanLeave {
    public hasLoaded: boolean;

    public readonly dispatchListColor = CardListColorEnum.BLUE;
    public readonly dispatchIconName = 'transfer.svg';

    public dispatchListConfig: Array<CardListConfig>;
    public dispatches: Array<Dispatch>;

    public fabListActivated: boolean;
    public offlineMode: boolean;

    private apiSending: boolean;
    private dispatchTranslations: Translations;

    public constructor(private sqliteService: SqliteService,
                       private networkService: NetworkService,
                       private alertService: AlertService,
                       private mainHeaderService: MainHeaderService,
                       private localDataManager: LocalDataManagerService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private formatService: FormatService,
                       private storageService: StorageService,
                       private translationService: TranslationService,
                       private navService: NavService) {
        this.hasLoaded = false;
        this.fabListActivated = false
        this.apiSending = false;
        this.offlineMode = false;
    }

    public ionViewWillEnter(): void {
        this.loadingService.presentLoadingWhile({
            event: () => {
                return zip(
                    this.storageService.getRight(StorageKeyEnum.DISPATCH_OFFLINE_MODE),
                    this.storageService.getString(StorageKeyEnum.OPERATOR),
                ).pipe(
                    mergeMap(([dispatchOfflineMode, operator]) => {
                        this.offlineMode = dispatchOfflineMode;
                        return this.sqliteService.findBy(`dispatch`, dispatchOfflineMode
                            ? [`createdBy = '${operator}'`]
                            : [`draft = 1`]);
                    })
                )
            }
        }).subscribe((dispatches) => {
            this.dispatches = dispatches;
            this.fabListActivated = false
            this.refreshPageList(this.dispatches);
        });
    }

    public wiiCanLeave(): boolean {
        return !this.apiSending;
    }

    public refreshSubTitle(): void {
        const length = (this.dispatches || []).length;
        this.mainHeaderService.emitSubTitle(`${length === 0 ? 'Aucune' : length} demande${length > 1 ? 's' : ''}`)
    }

    public onMenuClick(): void {
        this.fabListActivated = !this.fabListActivated;
    }

    public onAddClick(): void {
        this.navService.push(NavPathEnum.DISPATCH_NEW);
    }

    public onRefreshClick(): void{

    }

    public onGroupedSignatureClick(): void{
        this.navService.push(NavPathEnum.DISPATCH_GROUPED_SIGNATURE);
    }

    private refreshPageList(dispatches: Array<Dispatch>) {
        zip(
            this.translationService.getRaw(`Demande`, `Acheminements`, `Champs fixes`),
            this.translationService.getRaw(`Demande`, `Acheminements`, `Général`)
        ).subscribe(([fieldsTranslations, generalTranslations]) => {

            const fullTranslations = fieldsTranslations.concat(generalTranslations);
            this.dispatchTranslations = TranslationService.CreateTranslationDictionaryFromArray(fullTranslations);
            this.dispatches = dispatches;

            this.dispatchListConfig = this.dispatches.map((dispatch: Dispatch): CardListConfig => {
                return {
                    customColor: dispatch.groupedSignatureStatusColor || dispatch.color,
                    title: this.offlineMode ? {
                        label: 'Statut',
                        value: dispatch.statusLabel
                    } : {
                        label: 'Numéro',
                        value: dispatch.number
                    },
                    action: () => {
                        this.navService.push(NavPathEnum.DISPATCH_PACKS, {
                            localDispatchId: dispatch.localId,
                            fromCreate: true,
                        });
                    },
                    content: [
                        ...(this.offlineMode && dispatch.number ? [{
                            label: 'Numéro',
                            value: dispatch.number
                        }] : [{}]),
                        ...(this.offlineMode
                            ? (dispatch.syncAt
                                ? [{
                                    label: 'Dernière synchronisation',
                                    value: moment(dispatch.syncAt, moment.defaultFormat).format('DD/MM/YYYY HH:mm')
                                }]
                                : [{
                                    label: 'Synchronisé',
                                    value: 'Non'
                                }])
                            : [{}]),
                        {label: TranslationService.Translate(this.dispatchTranslations, 'N° tracking transporteur'), value: dispatch.carrierTrackingNumber || ''},
                        {label: 'Type', value: dispatch.typeLabel || ''},
                        {
                            label: TranslationService.Translate(this.dispatchTranslations, 'Emplacement de prise'),
                            value: dispatch.locationFromLabel || ''
                        },
                        {
                            label: TranslationService.Translate(this.dispatchTranslations, 'Emplacement de dépose'),
                            value: dispatch.locationToLabel || ''
                        },
                        {label: 'Commentaire', value: dispatch.comment || ''},
                        (dispatch.emergency
                            ? {label: 'Urgence', value: dispatch.emergency || ''}
                            : undefined)
                    ].filter((item) => item && item.value) as Array<{label: string; value: string;}>,
                    ...(this.offlineMode && !dispatch.syncAt
                        ? {
                            rightIcon: {
                                name: 'trash.svg',
                                color: 'danger',
                                action: () => {
                                    this.deleteDispatch(dispatch)
                                }
                            }
                        }
                        : {}),
                    ...(dispatch.emergency
                        ? {
                            rightIcon: {
                                name: 'exclamation-triangle.svg',
                                color: 'danger'
                            }
                        }
                        : {}),
                };
            });

            this.refreshSubTitle();
            this.hasLoaded = true;
        })
    }

    private deleteDispatch(dispatch: Dispatch){
        this.sqliteService.deleteBy(`dispatch`, [`id = '${dispatch.id}'`]);
        const selectedLinesToDelete = this.dispatches.findIndex((line) => line.id === dispatch.id);
        this.dispatches.splice(selectedLinesToDelete, 1);
        this.refreshPageList(this.dispatches);
    }
}
