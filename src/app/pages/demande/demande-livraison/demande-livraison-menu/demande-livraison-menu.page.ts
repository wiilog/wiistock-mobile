import {Component} from '@angular/core';
import {Observable, of, zip} from 'rxjs';
import {CardListColorEnum} from '@common/components/card-list/card-list-color.enum';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {DemandeLivraison} from '@entities/demande-livraison';
import {DemandeLivraisonType} from '@entities/demande-livraison-type';
import {CardListConfig} from '@common/components/card-list/card-list-config';
import {StorageService} from '@app/services/storage/storage.service';
import {MainHeaderService} from '@app/services/main-header.service';
import {NavService} from '@app/services/nav/nav.service';
import {mergeMap, map, tap} from 'rxjs';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {ToastService} from '@app/services/toast.service';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {LoadingService} from '@app/services/loading.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {AlertService} from '@app/services/alert.service';
import {NetworkService} from '@app/services/network.service';
import {ViewWillEnter} from "@ionic/angular";


@Component({
    selector: 'wii-demande-livraison-menu',
    templateUrl: './demande-livraison-menu.page.html',
    styleUrls: ['./demande-livraison-menu.page.scss'],
})
export class DemandeLivraisonMenuPage implements ViewWillEnter, CanLeave {
    public hasLoaded: boolean;

    public readonly demandeLivraisonListColor = CardListColorEnum.YELLOW;
    public readonly demandeLivraisonIconName = 'demande.svg';

    public demandesListConfig: Array<CardListConfig>;
    public demandesLivraison: Array<DemandeLivraison>;

    public fabListActivated: boolean;

    private apiSending: boolean;

    private readonly demandeLivraisonData: {
        typesConverter: { [id: number]: string };
        operator?: string;
        locationsConverter: { [id: number]: string };
        articlesCounters: { [id: number]: number };
    };

    public constructor(private sqliteService: SqliteService,
                       private networkService: NetworkService,
                       private alertService: AlertService,
                       private mainHeaderService: MainHeaderService,
                       private localDataManager: LocalDataManagerService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private storageService: StorageService,
                       private navService: NavService) {
        this.hasLoaded = false;
        this.fabListActivated = false
        this.apiSending = false;

        this.demandeLivraisonData = {
            typesConverter: {},
            operator: undefined,
            locationsConverter: {},
            articlesCounters: {}
        };
    }

    public ionViewWillEnter(): void {
        this.fabListActivated = false
        this.hasLoaded = false;
        this.storageService.getNumber(StorageKeyEnum.OPERATOR_ID)
            .pipe(
                mergeMap((userId) => this.sqliteService.findBy('demande_livraison', [`user_id = ${userId}`])),
                mergeMap((demandesLivraison: Array<DemandeLivraison>) => this.preloadData(demandesLivraison).pipe(map(() => demandesLivraison)))
            )
            .subscribe((demandesLivraison: Array<DemandeLivraison>) => {
                this.refreshPageList(demandesLivraison);
                this.hasLoaded = true;
            });
    }

    public wiiCanLeave(): boolean {
        return !this.apiSending;
    }

    public refreshSubTitle(): void {
        const demandeLivraisonsLength = (this.demandesLivraison || []).length;
        this.mainHeaderService.emitSubTitle(`${demandeLivraisonsLength === 0 ? 'Aucune' : demandeLivraisonsLength} demande${demandeLivraisonsLength > 1 ? 's' : ''}`)
    }

    public onMenuClick(): void {
        this.fabListActivated = !this.fabListActivated;
    }

    public async onRefreshClick() {
        this.fabListActivated = false;

        const hasNetwork = await this.networkService.hasNetwork();

        if (hasNetwork) {
            this.apiSending = true;
            this.loadingService.presentLoadingWhile({
                event: () => this.localDataManager.sendDemandesLivraisons().pipe(
                    mergeMap((data: { success: Array<number>, errors: Array<DemandeLivraison> }) => (
                        (data.errors.length > 0
                            ? this.preloadData(data.errors).pipe(map(() => data))
                            : of(data))
                    ))
                )
            })
                .subscribe({
                    next: (data: { success: Array<number>, errors: Array<DemandeLivraison> }) => {
                        const nbSuccess = data.success.length;
                        const sSuccess = nbSuccess > 1 ? 's' : '';

                        const nbErrors = data.errors.length;
                        const sErrors = nbErrors > 1 ? 's' : '';

                        const messages = [
                            nbSuccess > 0 ? `${nbSuccess} demande${sSuccess} synchronisée${sSuccess}` : '',
                            nbErrors > 0 ? `${nbErrors} demande${sErrors} en erreur` : ''
                        ]
                            .filter(Boolean)
                            .join(', ');

                        this.refreshPageList(data.errors);
                        this.toastService.presentToast(messages);
                        this.apiSending = false;
                    },
                    error: (result) => {
                        this.apiSending = false;
                        this.toastService.presentToast((result && result.message) ? result.message : 'Erreur serveur');
                    }
                });
        } else {
            this.alertService.show({
                header: 'Synchronisation impossible',
                cssClass: AlertService.CSS_CLASS_MANAGED_ALERT,
                message: 'Aucune connexion à internet, synchronisation des demandes impossible.',
                buttons: [{
                    text: 'Confirmer',
                    cssClass: 'alert-success'
                }]
            });
        }
    }

    public onAddClick(): void {
        this.navService.push(NavPathEnum.DEMANDE_LIVRAISON_HEADER, {
            isCreation: true
        });
    }

    private refreshPageList(demandesLivraison: Array<DemandeLivraison>) {
        const {articlesCounters, operator, locationsConverter, typesConverter} = this.demandeLivraisonData;

        this.demandesLivraison = demandesLivraison;

        this.demandesListConfig = this.demandesLivraison.map((demande: DemandeLivraison): CardListConfig => {
            const articlesCounter = articlesCounters[demande.id] || 0;
            const sArticle = articlesCounter > 1 ? 's' : '';
            return {
                title: {
                    label: 'Demandeur',
                    value: operator
                },
                content: [
                    {
                        label: 'Emplacement',
                        value: locationsConverter[demande.location_id] || ''
                    },
                    {
                        label: 'Type',
                        value: typesConverter[demande.type_id] || ''
                    },
                    {
                        label: 'Commentaire',
                        value: demande.comment
                    }
                ],
                info: `Non synchronisée, ${articlesCounter} article${sArticle} scanné${sArticle}`,
                error: demande.last_error,
                action: () => {
                    this.navService
                        .push(NavPathEnum.DEMANDE_LIVRAISON_HEADER, {
                            demandeId: demande.id,
                            isUpdate: true
                        })
                        .subscribe(() => {
                            this.navService.push(NavPathEnum.DEMANDE_LIVRAISON_ARTICLES, {
                                demandeId: demande.id,
                                isUpdate: true
                            });
                        });
                }
            };
        });

        this.refreshSubTitle();
    }

    public preloadData(demandesLivraison: Array<DemandeLivraison>): Observable<[{ [id: number]: string }, string, { [id: number]: string }, { [id: number]: number }]> {
        return zip(
            this.sqliteService.findAll<DemandeLivraisonType>('demande_livraison_type'),
            this.storageService.getString(StorageKeyEnum.OPERATOR) as Observable<string>
        )
            .pipe(
                mergeMap(([types, operator]: [Array<DemandeLivraisonType>, string]) => {
                    const locationIdsJoined = demandesLivraison
                        .map(({location_id}) => location_id)
                        .filter(Boolean)
                        .join(', ');
                    return (locationIdsJoined.length > 0
                        ? this.sqliteService.findBy('emplacement', [`id IN (${locationIdsJoined})`])
                        : of([]))
                        .pipe(
                            map((locations): any => ([
                                types.reduce((acc, {id, label}) => ({
                                    ...acc,
                                    [id]: label
                                }), {}),
                                operator,
                                locations.reduce((acc, {id, label}) => ({
                                    ...acc,
                                    [id]: label
                                }), {})
                            ]))
                        )
                }),
                mergeMap(([typesConverter, operator, locationsConverter]: [{ [id: number]: string }, string, { [id: number]: string }, { [id: number]: number }]) => {
                    return (demandesLivraison.length > 0
                        ? this.sqliteService.countArticlesByDemandeLivraison(demandesLivraison.map(({id}) => id))
                        : of({}))
                        .pipe(
                            map((counters): any => ([
                                typesConverter,
                                operator,
                                locationsConverter,
                                counters
                            ]))
                        )
                }),
                tap(([typesConverter, operator, locationsConverter, articlesCounters]: [{ [id: number]: string }, string, { [id: number]: string }, { [id: number]: number }]) => {
                    this.demandeLivraisonData.typesConverter = typesConverter;
                    this.demandeLivraisonData.operator = operator;
                    this.demandeLivraisonData.locationsConverter = locationsConverter;
                    this.demandeLivraisonData.articlesCounters = articlesCounters;
                })
            );
    }
}
