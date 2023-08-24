import {ChangeDetectorRef, Component} from '@angular/core';
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
import {merge, mergeMap, Observable, Subject, Subscription, tap, zip} from "rxjs";
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";
import {StorageKeyEnum} from "@app/services/storage/storage-key.enum";
import {FormatService} from "@app/services/format.service";
import * as moment from "moment";
import {BatteryManagerService} from "@plugins/battery-manager/battery-manager.service";
import {filter, map} from "rxjs/operators";
import {Status} from "@entities/status";
import {HttpErrorResponse} from "@angular/common/http";
import {IconColor} from "@common/components/icon/icon-color";

@Component({
    selector: 'wii-dispatch-request-menu',
    templateUrl: './dispatch-request-menu.page.html',
    styleUrls: ['./dispatch-request-menu.page.scss'],
})
export class DispatchRequestMenuPage implements ViewWillEnter, ViewWillLeave, CanLeave {
    public hasLoaded: boolean;

    public readonly dispatchListColor = CardListColorEnum.BLUE;
    public readonly dispatchIconName = 'transfer.svg';

    public dispatchListConfig: Array<CardListConfig>;
    public dispatches: Array<Dispatch>;

    public fabListActivated: boolean;
    public offlineMode: boolean;
    public loading: boolean;

    public operator?: string | any;

    public messageLoading?: string;

    private apiSending: boolean;
    private dispatchTranslations: Translations;

    private batteryInfoSubscription?: Subscription;

    private lastBatteryStateChangePlugged: boolean;

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
                       private changeDetectorRef: ChangeDetectorRef,
                       private batteryManager: BatteryManagerService,
                       private navService: NavService) {
        this.hasLoaded = false;
        this.loading = false;
        this.fabListActivated = false
        this.apiSending = false;
        this.offlineMode = false;
    }

    public ionViewWillEnter(): void {
        this.loadingService.presentLoadingWhile({
            event: () => this.initializeDispatchesList()
        }).subscribe((dispatches) => {
            this.dispatches = dispatches;
            this.fabListActivated = false
            this.refreshPageList(this.dispatches);

            this.batteryManager.launchEventListeners();
            this.batteryInfoSubscription = merge(
                this.batteryManager.batteryInfo(),
                this.batteryManager.stateChanged$
            )
                .pipe(
                    filter(({plugged}) => this.lastBatteryStateChangePlugged !== plugged && !this.loading),
                    tap(({plugged}) => {
                        this.lastBatteryStateChangePlugged = plugged;
                    }),
                    filter(({plugged}) => plugged),
                    mergeMap(() => this.loadingService.presentLoadingWhile({
                        event: () => this.networkService.hasNetworkTry(),
                        message: 'Vérification de la connexion...',
                    })),
                    mergeMap(() => this.batteryManager.batteryInfo()),
                )
                .subscribe(() => {
                    this.synchronise();
                });
        });
    }

    public wiiCanLeave(): boolean {
        return !this.apiSending;
    }

    public ionViewWillLeave(): void {
        this.batteryManager.removeEventListeners();
        if (this.batteryInfoSubscription?.closed === false) {
            this.batteryInfoSubscription.unsubscribe();
            this.batteryInfoSubscription = undefined;
        }
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

    public onGroupedSignatureClick(): void{
        this.navService.push(NavPathEnum.DISPATCH_GROUPED_SIGNATURE);
    }

    private refreshPageList(dispatches: Array<Dispatch>) {
        this.dispatches = dispatches;

        this.dispatchListConfig = this.dispatches.map((dispatch: Dispatch): CardListConfig => {
            return {
                customColor: dispatch.groupedSignatureStatusColor || dispatch.color,
                title: this.offlineMode
                    ? {
                        label: 'Statut',
                        value: dispatch.draft ? dispatch.statusLabel || 'Brouillon' : dispatch.statusLabel
                    }
                    : {
                        label: 'Numéro',
                        value: dispatch.number
                    },
                action: () => {
                    this.navService.push(NavPathEnum.DISPATCH_PACKS, {
                        localDispatchId: dispatch.localId,
                        fromCreate: true,
                        viewMode: !dispatch.draft,
                    });
                },
                content: [
                    ...(this.offlineMode && dispatch.number ? [{
                        label: 'Numéro',
                        value: dispatch.number
                    }] : [{}]),
                    ...(this.offlineMode
                        ? (dispatch.updatedAt
                            ? [{
                                label: 'Dernière synchronisation',
                                value: moment(dispatch.updatedAt, moment.defaultFormat).format('DD/MM/YYYY HH:mm')
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
                    {
                        label: 'Commentaire',
                        value: dispatch.comment || '',
                    },
                    {
                        label: 'Références (quantité)',
                        value: dispatch.quantities || ''
                    },
                    (dispatch.emergency
                        ? {label: 'Urgence', value: dispatch.emergency || ''}
                        : undefined)
                ].filter((item) => item && item.value) as Array<{label: string; value: string;}>,
                rightIcon: [
                    ...(dispatch.emergency
                        ? [{
                            name: 'exclamation-triangle.svg',
                            color: 'danger' as IconColor
                        }] : []),
                    ...(this.offlineMode && !dispatch.id && dispatch.draft
                        ? [{
                            name: 'trash.svg',
                            color: 'danger' as IconColor,
                            action: () => {
                                this.deleteDispatch(dispatch)
                            }
                        }] : []),
                ]
            };
        });

        this.refreshSubTitle();
        this.hasLoaded = true;
    }

    private deleteDispatch(dispatch: Dispatch){
        this.sqliteService.deleteBy(`dispatch`, [`localId = '${dispatch.localId}'`]);
        const selectedLinesToDelete = this.dispatches.findIndex((line) => line.localId === dispatch.localId);
        this.dispatches.splice(selectedLinesToDelete, 1);
        this.refreshPageList(this.dispatches);
    }

    public synchronise(): Observable<void> {
        const $res = new Subject<void>();

        this.networkService.hasNetwork().then((hasNetwork) => {
            if (hasNetwork) {
                this.loading = true;
                this.hasLoaded = false;
                this.changeDetectorRef.detectChanges();
                this.localDataManager.synchroniseDispatchesData()
                    .subscribe({
                        next: ({finished, message}) => {
                            this.messageLoading = message;
                            if (finished) {
                                this.initializeDispatchesList()
                                    .subscribe((dispatches) => {
                                        this.dispatches = dispatches;
                                        this.refreshPageList(this.dispatches);
                                    });

                                this.loading = false;
                                this.hasLoaded = true;
                                this.changeDetectorRef.detectChanges();
                                $res.next();
                                $res.complete();
                            } else {
                                this.loading = true;
                                this.hasLoaded = false;
                                this.changeDetectorRef.detectChanges();
                            }
                        },
                        error: (error) => {
                            this.loading = false;
                            this.hasLoaded = true;
                            this.changeDetectorRef.detectChanges();

                            if (error instanceof HttpErrorResponse) {
                                if (error.status === 0) { // connection lost
                                    // For testing => turn on plane mode during synchronisation
                                    // not working in livereload build
                                    this.alertService.show({
                                        header: 'Attention',
                                        message: `La connexion avec le serveur a été perdue, la récupération des données n'a pas pu se faire`,
                                        buttons: [
                                            {
                                                text: 'Réessayer',
                                                handler: () => {
                                                    this.synchronise();
                                                },
                                            },
                                        ]
                                    })
                                }
                            }
                            else {
                                const {api, message} = error;
                                if (api && message) {
                                    this.toastService.presentToast(message);
                                }
                            }
                            $res.complete();
                            throw error;
                        }
                    });
            }
            else {
                this.loading = false;
                this.hasLoaded = true;
                this.toastService.presentToast('Veuillez vous connecter à internet afin de synchroniser vos données');
                $res.complete();
            }
        });

        return $res;
    }

    public initializeDispatchesList(): Observable<Array<Dispatch>>{
        return zip(
            this.storageService.getRight(StorageKeyEnum.DISPATCH_OFFLINE_MODE),
            this.storageService.getString(StorageKeyEnum.OPERATOR),
            this.translationService.getRaw(`Demande`, `Acheminements`, `Champs fixes`),
            this.translationService.getRaw(`Demande`, `Acheminements`, `Général`),
        ).pipe(
            mergeMap(([dispatchOfflineMode, operator, fieldsTranslations, generalTranslations]) => {
                this.dispatchTranslations = TranslationService.CreateTranslationDictionaryFromArray(fieldsTranslations.concat(generalTranslations));
                this.offlineMode = dispatchOfflineMode;
                this.operator = operator;
                return this.sqliteService.findBy('status', [
                    `category = 'acheminement'`,
                ]);
            }),
            mergeMap(() => this.sqliteService.findBy('status', [
                `category = 'acheminement'`,
            ])),
            mergeMap((statuses) => {
                return this.sqliteService.findBy(`dispatch`, this.offlineMode
                    ? [`createdBy = '${this.operator}'`]
                    : [`draft = 1`])
                    .pipe(
                        map((dispatches) => {

                            // Sort priority : emergency > stateNumber > displayOrder > typeId
                            return dispatches
                                .map((dispatch) => {
                                    const dispatchStatus = statuses.find((status) => status.id === dispatch.statusId);
                                    return {...dispatch, status: dispatchStatus || {stateNumber: -1, displayOrder: -1}};
                                })
                                .sort((prevDispatch: Dispatch & { status?: Status }, nextDispatch: Dispatch & { status?: Status }) => {
                                    return prevDispatch.typeId === nextDispatch.typeId
                                        ? 0
                                        : (prevDispatch.typeId > nextDispatch.typeId ? 1 : -1);
                                })
                                .sort((prevDispatch: Dispatch & { status?: Status }, nextDispatch: Dispatch & { status?: Status }) => {
                                    const prevStatus = prevDispatch.status;
                                    const nextStatus = nextDispatch.status;
                                    const prevDisplayOrder = prevStatus?.displayOrder || -1;
                                    const nextDisplayOrder = nextStatus?.displayOrder || -1;
                                    return prevDisplayOrder === nextDisplayOrder
                                        ? 0
                                        : (prevDisplayOrder > nextDisplayOrder ? 1 : -1);
                                })
                                .sort((prevDispatch: Dispatch & { status?: Status }, nextDispatch: Dispatch & { status?: Status }) => {
                                    const prevStatus = prevDispatch.status;
                                    const nextStatus = nextDispatch.status;

                                    return prevStatus && nextStatus && prevStatus.stateNumber === nextStatus.stateNumber
                                        ? 0
                                        :(prevStatus && nextStatus && prevStatus.stateNumber > nextStatus.stateNumber ? 1 : -1);
                                })
                                .sort((prevDispatch: Dispatch & { status?: Status }, nextDispatch: Dispatch & { status?: Status }) => {
                                    return prevDispatch.emergency && nextDispatch.emergency
                                        ? 0
                                        : (prevDispatch.emergency ? -1 : 1);
                                });
                        })
                    )
            }),
        );
    }
}
