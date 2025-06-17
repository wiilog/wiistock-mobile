import {Injectable} from '@angular/core';
import {ApiService} from '@app/services/api.service';
import {Preparation} from '@entities/preparation';
import {Mouvement} from '@entities/mouvement';
import {Livraison} from '@entities/livraison';
import {Collecte} from '@entities/collecte';
import {MouvementTraca} from '@entities/mouvement-traca';
import {FileService} from "@app/services/file.service";
import {StorageService} from "@app/services/storage/storage.service";
import {merge, Observable, of, ReplaySubject, Subject, tap, zip} from 'rxjs';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {catchError, mergeMap, map} from 'rxjs/operators';
import {DemandeLivraison} from '@entities/demande-livraison';
import {DemandeLivraisonArticleSelected} from '@entities/demande-livraison-article-selected';
import {TransferOrder} from '@entities/transfer-order';
import {AlertService} from '@app/services/alert.service';
import {TranslationService} from '@app/services/translations.service';
import {DispatchPack} from '@entities/dispatch-pack';
import {StorageKeyEnum} from "@app/services/storage/storage-key.enum";
import {Dispatch} from "@entities/dispatch";


type Process = 'preparation' | 'livraison' | 'collecte' | 'inventory' | 'inventoryAnomalies' | 'dispatch' | 'transfer' | 'empty_round';
interface ApiProccessConfig {
    service: { service: string; method: string };
    createApiParams: () => Observable<{paramName: string, [name: string]: any}>

    // after api submit
    deleteSucceed: (resSuccess: any) => Observable<any>;
    resetFailed?: (resError: any) => Observable<any>;
    treatData?: (data: any) => Observable<any>;
    titleErrorAlert?: string;
    numeroProccessFailed?: string;
}

type DemandeForApi = {
    type: number;
    destination: number;
    commentaire?: string;
    references: Array<{barCode: string; 'quantity-to-pick': number}>;
    freeFields: string;
};

@Injectable({
    providedIn: 'root'
})
export class LocalDataManagerService {

    private readonly apiProccessConfigs: {[type in Process]: ApiProccessConfig};

    private dispatchOfflineMode: boolean = false;

    public constructor(private sqliteService: SqliteService,
                       private apiService: ApiService,
                       private fileService: FileService,
                       private storageService: StorageService,
                       private alertService: AlertService,
                       private translationService: TranslationService) {

        this.apiProccessConfigs = {
            preparation: {
                service: ApiService.FINISH_PREPA,
                createApiParams: () => (
                    zip(
                        this.sqliteService.findAll('preparation'),
                        this.sqliteService.findAll('mouvement')
                    )
                        .pipe(
                            map(([preparations, mouvements]: [Array<Preparation>, Array<Mouvement>]): [Array<Preparation>, Array<Mouvement>] => ([
                                preparations.filter(({date_end}) => date_end),
                                mouvements.filter(({id_prepa}) => id_prepa)
                            ])),
                            map(([preparations, mouvements]: [Array<Preparation>, Array<Mouvement>]) => ({
                                paramName: 'preparations',
                                preparations: preparations
                                    .map((preparation) => ({
                                        ...preparation,
                                        mouvements: mouvements.filter(({id_prepa}) => (id_prepa === preparation.id))
                                    }))
                            }))
                        )
                ),
                titleErrorAlert: `Des préparations n'ont pas pu être synchronisées`,
                numeroProccessFailed: 'numero_prepa',
                deleteSucceed: (resSuccess) => {
                    const idsToDelete = resSuccess.map(({id_prepa}: any) => id_prepa);

                    return zip(
                        this.sqliteService.deletePreparationsById(idsToDelete),
                        this.sqliteService.deleteMouvementsBy('id_prepa', idsToDelete)
                    );
                },
                resetFailed: (resError) => {
                    const idsToDelete = resError.map(({id_prepa}: any) => id_prepa);
                    return zip(
                        this.sqliteService.resetFinishedPrepas(idsToDelete),
                        this.sqliteService.resetArticlePrepaByPrepa(idsToDelete),
                        this.sqliteService.deleteMouvementsBy('id_prepa', idsToDelete)
                    );
                },
                treatData: (data) => {
                    const {preparations} = data;
                    return (preparations && preparations.length > 0)
                        ? of(undefined).pipe(
                            mergeMap(() => this.sqliteService.importPreparations(data, false)),
                            mergeMap(() => this.sqliteService.importArticlesPrepaByRefArticle(data, true))
                        )
                        : of(undefined)
                }
            },
            livraison: {
                service: ApiService.FINISH_LIVRAISON,
                createApiParams: () => (
                    zip(
                        this.sqliteService.findAll<Livraison>('livraison'),
                        this.sqliteService.findAll<Mouvement>('mouvement')
                    )
                        .pipe(
                            map(([livraisons, mouvements]): [Array<Livraison>, Array<Mouvement>] => ([
                                livraisons.filter(({date_end}) => date_end),
                                mouvements.filter(({id_livraison}) => id_livraison)
                            ])),
                            map(([livraisons, mouvements]: [Array<Livraison>, Array<Mouvement>]) => ({
                                paramName: 'livraisons',
                                livraisons: livraisons
                                    .map((livraison) => ({
                                        ...livraison,
                                        mouvements: mouvements.filter(({id_livraison}) => (id_livraison === livraison.id))
                                    }))
                            }))
                        )
                ),
                titleErrorAlert: `Des livraisons n'ont pas pu être synchronisées`,
                numeroProccessFailed: 'numero_livraison',
                deleteSucceed: (resSuccess) => {
                    const idsToDelete = resSuccess.map(({id_livraison}: any) => id_livraison);

                    return zip(
                        this.sqliteService.deleteLivraionsById(idsToDelete),
                        this.sqliteService.deleteMouvementsBy('id_livraison', idsToDelete)
                    );
                },
                resetFailed: (resError) => {
                    const idsToDelete = resError.map(({id_livraison}: any) => id_livraison);
                    return zip(
                        idsToDelete.length > 0
                            ? this.sqliteService.update('livraison', [{values: {date_end: null, location: null}, where: [`id IN (${idsToDelete.join(',')})`]}])
                            : of(undefined),
                        this.sqliteService.deleteMouvementsBy('id_livraison', idsToDelete)
                    );
                }
            },
            collecte: {
                service: ApiService.FINISH_COLLECTE,
                createApiParams: () => (
                    zip(
                        this.sqliteService.findAll<Collecte>('collecte'),
                        this.sqliteService.findAll<Mouvement>('mouvement')
                    )
                        .pipe(
                            map(([collectes, mouvements]): [Array<Collecte>, Array<Mouvement>] => ([
                                collectes.filter(({date_end}) => date_end),
                                mouvements.filter(({id_collecte}) => id_collecte)
                            ])),
                            map(([collectes, mouvements]: [Array<Collecte>, Array<Mouvement>]) => ({
                                paramName: 'collectes',
                                collectes: collectes
                                    .map((collecte) => ({
                                        ...collecte,
                                        mouvements: mouvements
                                            .filter(({id_collecte}) => (id_collecte === collecte.id))
                                            .map(({is_ref, barcode, quantity}) => ({is_ref, barcode, quantity}))
                                    }))
                            }))
                        )
                ),
                titleErrorAlert: `Des collectes n'ont pas pu être synchronisées`,
                numeroProccessFailed: 'numero_collecte',
                treatData: (data) => {
                    const dataToTreat = (data || {});

                    const newCollectes = (dataToTreat.newCollectes || []);
                    const articlesCollecte = (dataToTreat.articlesCollecte || []);
                    const stockTakings = (dataToTreat.stockTakings || []);

                    return (
                        (newCollectes.length > 0 || articlesCollecte.length > 0 || stockTakings.length > 0)
                            ? zip(
                                // import collecte
                                ...(newCollectes.map((newCollecte: any) => this.sqliteService.insert('collecte', newCollecte))),

                                // import articlesCollecte
                                ...(
                                    articlesCollecte.map((newArticleCollecte: any) => (
                                        this.sqliteService.query(
                                            this.sqliteService.getArticleCollecteInsertQuery([this.sqliteService.getArticleCollecteValueFromApi(newArticleCollecte)])
                                        )
                                    ))
                                ),

                                // import new mouvementsTraca
                                ...(stockTakings.map((taking: any) => this.sqliteService.insert('mouvement_traca', taking)))
                            )
                            : of(undefined)
                    );
                },
                deleteSucceed: (resSuccess) => {
                    const idsToDelete = resSuccess.map(({id_collecte}: any) => id_collecte);

                    return zip(
                        this.sqliteService.deleteCollecteById(idsToDelete),
                        this.sqliteService.deleteMouvementsBy('id_collecte', idsToDelete)
                    );
                },
                resetFailed: (resError) => {
                    const idsToDelete = resError.map(({id_collecte}: any) => id_collecte);
                    return zip(
                        this.sqliteService.resetFinishedCollectes(idsToDelete),
                        this.sqliteService.deleteMouvementsBy('id_collecte', idsToDelete)
                    );
                }
            },
            transfer: {
                service: ApiService.FINISH_TRANSFER,
                createApiParams: () => (
                    this.sqliteService
                        .findBy('transfer_order', ['treated = 1'])
                        .pipe(
                            map((transfers: Array<TransferOrder>) => ({
                                paramName: 'transfers',
                                transfers: transfers
                                    .map(({id, destination}) => ({id, destination}))
                            }))
                        )
                ),
                titleErrorAlert: `Des transferts n'ont pas pu être synchronisées`,
                deleteSucceed: (resSuccess) => {
                    return (resSuccess && resSuccess.length > 0)
                        ? zip(
                            this.sqliteService.deleteBy('transfer_order', [`id IN (${resSuccess.map((transfer: any) => transfer.id).join(',')})`]),
                            this.sqliteService.deleteBy('transfer_order_article', [`transfer_order_id IN (${resSuccess.map((transfer: any) => transfer.id).join(',')})`])
                        )
                        : of(undefined);
                },
                resetFailed: (resError) => {
                    return (resError && resError.length > 0)
                        ? this.sqliteService.update('transfer_order', [{
                            values: {
                                treated: 0
                            },
                            where: [`id IN (${resError
                                .map((transfer: any) => transfer.id)
                                .join(',')
                            })`]
                        }])
                        : of(undefined);
                }
            },
            inventory: {
                service: ApiService.ADD_INVENTORY_ENTRIES,
                createApiParams: () => this.sqliteService.findAll('saisie_inventaire').pipe(map((entries) => ({
                    paramName: 'entries',
                    entries
                }))),
                treatData: ({anomalies}) => {
                    return (anomalies && anomalies.length > 0)
                        ? this.sqliteService.importAnomaliesInventaire({anomalies}, false)
                        : of(undefined);
                },
                deleteSucceed: () => this.sqliteService.deleteBy('saisie_inventaire')
            },
            inventoryAnomalies: {
                service: ApiService.TREAT_ANOMALIES,
                createApiParams: () => this.sqliteService.findBy('anomalie_inventaire', [`treated = '1'`]).pipe(map((anomalies) => ({
                    paramName: 'anomalies',
                    anomalies
                }))),
                deleteSucceed: (success) => (
                    (success && success.length > 0)
                        ? this.sqliteService.deleteBy('anomalie_inventaire', [
                            `id IN (${success.join(',')})`
                        ])
                        : of(undefined)
                )
            },
            dispatch: {
                service: ApiService.PATCH_DISPATCH,
                createApiParams: () => this.sqliteService.findBy('dispatch', ['treatedStatusId IS NOT NULL']).pipe(
                    mergeMap((dispatches) => zip(
                        of(dispatches),
                        dispatches.length > 0
                            ? this.sqliteService.findBy('dispatch_pack', [
                                `dispatchId IN (${dispatches.map(({id}: any) => id).join(',')})`,
                                `already_treated = 0`,
                                'treated = 1'
                            ])
                            : of([])
                    )),

                    map(([dispatches, dispatchPacks]) => ({
                        paramName: 'dispatches',
                        dispatches: dispatches.map(({id, treatedStatusId}: any) => ({id, treatedStatusId})),
                        ...this.mapDispatchPacks(dispatchPacks)
                    }))),
                deleteSucceed: ({entireTreatedDispatch}) => zip(
                    (entireTreatedDispatch && entireTreatedDispatch.length > 0)
                        ? this.sqliteService.deleteBy('dispatch', [
                            `treatedStatusId IS NOT NULL`,
                            `id IN (${entireTreatedDispatch.join(',')})`
                        ])
                        : of(undefined),
                    (entireTreatedDispatch && entireTreatedDispatch.length > 0)
                        ? this.sqliteService.deleteBy('dispatch_pack', [
                            `treated = 1`,
                            `dispatchId IN (${entireTreatedDispatch.map(({id}: any) => id).join(',')})`
                        ])
                        : of(undefined),
                    this.sqliteService.update('dispatch_pack', [{
                        values: {already_treated: 1, treated: 0},
                        where: [
                            `treated = 1`,
                            ...((entireTreatedDispatch && entireTreatedDispatch.length > 0) ? [`dispatchId NOT IN (${entireTreatedDispatch.map(({id}: any) => id).join(',')})`] : [])
                        ]
                    }])
                )
            },
            empty_round: {
                service: ApiService.POST_EMPTY_ROUND,
                createApiParams: () => (
                    this.sqliteService
                        .findBy('empty_round')
                        .pipe(map((emptyRounds) => ({
                                paramName: 'params',
                                params: emptyRounds
                            }))
                        )
                ),
                deleteSucceed: (success) => (
                    (success && success.length > 0)
                        ? this.sqliteService.deleteBy('empty_round')
                        : of(undefined)
                )
            }
        }
    }

    private static ShowSyncMessage(res$: Subject<any>) {
        res$.next({finished: false, message: 'Synchronisation des données en cours...'});
    }

    public synchroniseData(): Observable<{finished: boolean, message?: string}> {
        const synchronise$ = new ReplaySubject<{finished: boolean, message?: string}>(1);

        LocalDataManagerService.ShowSyncMessage(synchronise$);
        this.importData()
            .pipe(
                mergeMap(() => {
                    return this.storageService.getRight(StorageKeyEnum.DISPATCH_OFFLINE_MODE);
                }),
                tap((dispatchOfflineMode) => {
                    this.dispatchOfflineMode = dispatchOfflineMode;
                }),
                mergeMap(() => {
                    synchronise$.next({finished: false, message: 'Envoi des préparations non synchronisées'});
                    return this.sendFinishedProcess('preparation').pipe(map(Boolean));
                }),
                mergeMap((needAnotherSynchronise) => {
                    synchronise$.next({finished: false, message: 'Envoi des livraisons non synchronisées'});
                    return this.sendFinishedProcess('livraison').pipe(map((needAnotherSynchroniseLivraison) => needAnotherSynchronise || Boolean(needAnotherSynchroniseLivraison)));
                }),
                mergeMap((needAnotherSynchronise) => {
                    synchronise$.next({finished: false, message: 'Envoi des collectes non synchronisées'});
                    return this.sendFinishedProcess('collecte').pipe(map((needAnotherSynchroniseCollecte) => needAnotherSynchronise || Boolean(needAnotherSynchroniseCollecte)));
                }),
                mergeMap((needAnotherSynchronise) => {
                    synchronise$.next({finished: false, message: 'Envoi des prises et des déposes'});
                    return this.sendMouvementTraca(false).pipe(map(() => needAnotherSynchronise));
                }),
                mergeMap((needAnotherSynchronise) => {
                    synchronise$.next({finished: false, message: 'Envoi des saisies d\'inventaire'});
                    return this.sendFinishedProcess('inventory').pipe(map(() => needAnotherSynchronise));
                }),
                mergeMap((needAnotherSynchronise) => {
                    synchronise$.next({finished: false, message: 'Envoi des anomalies d\'inventaire'});
                    return this.sendFinishedProcess('inventoryAnomalies').pipe(map(() => needAnotherSynchronise));
                }),
                mergeMap((needAnotherSynchronise) => {
                    synchronise$.next({finished: false, message: 'Envoi des acheminements'});
                    return this.dispatchOfflineMode
                        ? of(needAnotherSynchronise)
                        : this.sendFinishedProcess('dispatch').pipe(map(() => needAnotherSynchronise));
                }),
                mergeMap((needAnotherSynchronise) => {
                    synchronise$.next({finished: false, message: 'Envoi des transferts'});
                    return this.sendFinishedProcess('transfer').pipe(map(() => needAnotherSynchronise));
                }),
                mergeMap((needAnotherSynchronise) => {
                    synchronise$.next({finished: false, message: 'Envoi des mouvements de passage à vide non synchronisés'});
                    return this.sendFinishedProcess('empty_round').pipe(map(() => needAnotherSynchronise));
                }),
                // we reload data from API if we have save data in previous requests
                mergeMap((needAnotherSynchronise) => {
                    if (needAnotherSynchronise) {
                        LocalDataManagerService.ShowSyncMessage(synchronise$);
                    }
                    return needAnotherSynchronise ? this.importData() : of(false);
                })
            )
            .subscribe({
                next: () => {
                    this.translationService.changedTranslations$.next();
                    synchronise$.next({finished: true});
                    synchronise$.complete();
                },
                error: (error) => {
                    synchronise$.error(error);
                    synchronise$.complete();
                }
            });

        return synchronise$;
    }

    public synchroniseDispatchesData(){
        const synchronise$ = new ReplaySubject<{finished: boolean, message?: string}>(1);

        LocalDataManagerService.ShowSyncMessage(synchronise$);
        this.sendOfflineDispatches()
            .pipe(
                mergeMap(() => {
                    return this.importData();
                })
            )
            .subscribe({
                next: () => {
                    this.translationService.changedTranslations$.next();
                    synchronise$.next({finished: true});
                    synchronise$.complete();
                },
                error: (error) => {
                    synchronise$.error(error);
                    synchronise$.complete();
                }
            });

        return synchronise$;
    }

    public importData(): Observable<any> {
        return this.apiService
            .requestApi(ApiService.GET_DATA)
            .pipe(
                mergeMap(({data}) => (
                    this.storageService
                        .updateRights(data.rights || {})
                        .pipe(map(() => ({data})))
                )),
                mergeMap(({data}) => (
                    this.storageService
                        .updateParameters(data.parameters || {})
                        .pipe(map(() => ({data})))
                )),
                mergeMap(({data}) => (
                    this.storageService
                        .updateFieldParams(data.fieldsParam || {})
                        .pipe(map(() => ({data})))
                )),
                mergeMap(({data}) => this.sqliteService.importData(data))
            );
    }

    private sendOfflineDispatches() {
        return zip(
            this.sqliteService.findBy('dispatch'),
            this.sqliteService.findBy('dispatch_pack'),
            this.sqliteService.findBy('dispatch_reference'),
            this.sqliteService.findBy('grouped_signature_history'),
            this.sqliteService.findBy('dispatch_waybill'),
        )
            .pipe(
                map(([dispatches, dispatchPacks, dispatchReferences, groupedSignatureHistory, waybillData]) => {
                    dispatchReferences = dispatchReferences
                        .map(({localDispatchPackId, ...remaining}) => {
                            const dispatchPack = dispatchPacks.find(({localId}) => localDispatchPackId === localId);
                            return {
                                ...remaining,
                                dispatchId: dispatchPack?.dispatchId,
                                localDispatchId: dispatchPack?.localDispatchId,
                                logisticUnit: dispatchPack?.code,
                                natureId: dispatchPack?.natureId,
                                packComment: dispatchPack?.comment,
                                packVolume: dispatchPack?.volume,
                                packWeight: dispatchPack?.weight,
                            };
                        })
                        .filter(({localDispatchId}) => dispatches.findIndex(({localId}: Dispatch) => localId === localDispatchId) > -1);
                    return [dispatches, dispatchPacks, dispatchReferences, groupedSignatureHistory, waybillData];
                }),
                mergeMap(([dispatches, dispatchPacks, dispatchReferences, groupedSignatureHistory, waybillData]) => (
                    dispatches.length > 0
                        ? this.apiService.requestApi(ApiService.NEW_OFFLINE_DISPATCHES, {
                            params: {
                                dispatches,
                                dispatchPacks,
                                dispatchReferences,
                                waybillData,
                                groupedSignatureHistory,
                            }
                        })
                        : of({
                            success: false,
                            errors: [],
                        })
                )),
                map(({success, errors}) => {
                    return !success && errors.length > 0
                        ? this.alertService.show({
                            header: 'Erreur',
                            message: errors.map((errorMessage: string) => errorMessage).join(','),
                            buttons: [{
                                text: 'OK',
                                role: 'cancel'
                            }]
                        })
                        : of(undefined)
                }),
                mergeMap(() => this.sqliteService.deleteBy('grouped_signature_history')),
                mergeMap(() => this.sqliteService.deleteBy('dispatch_waybill')),
            );
    }

    public sendMouvementTraca(sendFromStock: boolean, createTakeAndDrop: boolean = false): Observable<any> {
        return this.sqliteService.findAll<MouvementTraca & {subPacks: any}>('mouvement_traca')
            .pipe(
                map((mouvements) => (
                   this.mapTrackingMovements(mouvements.filter(({fromStock, isGroup, subPacks}) => ((!isGroup || subPacks === '[]') && sendFromStock === Boolean(fromStock))))
                )),
                mergeMap((mouvements: Array<MouvementTraca<File> & {subPacks?: any}>) => (
                    mouvements.length > 0
                        ? (
                            this.apiService
                                .requestApi(
                                    sendFromStock ? ApiService.POST_STOCK_MOVEMENTS : ApiService.POST_TRACKING_MOVEMENTS,
                                    {params: this.extractTrackingMovementFiles(mouvements, createTakeAndDrop)})
                                .pipe(
                                    map((apiResponse) => [apiResponse, mouvements]),
                                    mergeMap(([apiResponse, mouvements]) => {
                                        const refArticlesErrors = Object.keys((apiResponse && apiResponse.data && apiResponse.data.errors) || {});
                                        return (
                                            (apiResponse && apiResponse.success)
                                                ? zip(
                                                    this.sqliteService.importMouvementTraca({
                                                        trackingTaking: apiResponse.data.persistedMovements || []
                                                    }),
                                                    this.updateSucceedTracking(refArticlesErrors, mouvements),
                                                    this.sqliteService.resetMouvementsTraca(refArticlesErrors, 'prise', sendFromStock)
                                                ).pipe(map(() => apiResponse))
                                                : of(undefined)
                                        );
                                    })
                                )
                        )
                        : of(undefined)
                ))
            );
    }

    public saveTrackingMovements(trackingsToSave: Array<MouvementTraca>, prisesToFinish: Array<number> = []): Observable<any> {
        const movements = trackingsToSave
            .map((mouvement) => ({
                id: null,
                ...mouvement,
                date: mouvement.date + '_' + Math.random().toString(36).substr(2, 9),
                articles: mouvement.articles
                    ? (Array.isArray(mouvement.articles) ? mouvement.articles.join(';') : mouvement.articles)
                    : null
            }));

        return zip(
            this.sqliteService.insert('mouvement_traca', movements),
            this.sqliteService.finishPrises(prisesToFinish)
        )
            .pipe(map(() => undefined))
    }

    /**
     * Send all "preparations", "livraisons" or "collectes", "inventory" finished in local database to the api
     * @return false if no request has been done, or api response
     */
    public sendFinishedProcess(process: Process): Observable<{success: any, error: any}|false> {
        const apiProccessConfig = this.apiProccessConfigs[process];
        return apiProccessConfig.createApiParams()
            .pipe(
                mergeMap(({paramName, ...params}) => {
                    let res$: Observable<false>|Subject<{success: any, error: any}>;
                    if (params[paramName] && params[paramName].length > 0) {
                        res$ = new Subject<{success: any, error: any}>();
                        this.apiService
                            .requestApi(apiProccessConfig.service, {params})
                            .pipe(mergeMap((res) => {
                                const {success, errors, data} = res;
                                if (apiProccessConfig.titleErrorAlert
                                    && apiProccessConfig.numeroProccessFailed
                                    && errors
                                    && errors.length > 0) {
                                    this.presentAlertError(
                                        apiProccessConfig.titleErrorAlert,
                                        apiProccessConfig.numeroProccessFailed,
                                        errors
                                    );
                                }

                                return of(undefined)
                                    .pipe(
                                        mergeMap(() => apiProccessConfig.deleteSucceed(success)),
                                        mergeMap(() => apiProccessConfig.resetFailed
                                            ? apiProccessConfig.resetFailed(errors)
                                            : of(undefined)),
                                        mergeMap(() => apiProccessConfig.treatData && data
                                            ? apiProccessConfig.treatData(data)
                                            : of(undefined)),
                                    )
                                    .pipe(map(() => res));
                            }))
                            .subscribe({
                                next: (res: { success: any, error: any }) => {
                                    (res$ as Subject<{ success: any, error: any }>).next(res);
                                },
                                error: (err) => {
                                    (res$ as Subject<{ success: any, error: any }>).error({...err, api: true})
                                }
                            })
                    }
                    else {
                        res$ = of(false);
                    }

                    return res$;
                })
            );
    }

    /**
     * Send all draft to the API
     * Return observable with the list of id in success and DemandeLivraison errors
     */
    public sendDemandesLivraisons(): Observable<{success: Array<number>, errors: Array<DemandeLivraison>}> {
        return zip(
            this.sqliteService.findAll<DemandeLivraison>('demande_livraison'),
            this.sqliteService.findAll<DemandeLivraisonArticleSelected>('article_in_demande_livraison')
        ).pipe(
            // make data to send to the API
            map(([demandeLivraison, articlesSelected]) => {
                return demandeLivraison.reduce((acc: Array<{apiData: DemandeForApi, demande: DemandeLivraison}>, demande: DemandeLivraison) => {
                    const articleForDemande = articlesSelected.filter(({demande_id}) => (demande_id === demande.id));

                    if (articleForDemande.length > 0) {
                        acc.push({
                            apiData: {
                                type: demande.type_id,
                                destination: demande.location_id,
                                commentaire: demande.comment,
                                references: articleForDemande.map(({article_bar_code: barCode, quantity_to_pick}) => ({
                                    barCode,
                                    'quantity-to-pick': quantity_to_pick
                                })),
                                freeFields: demande.free_fields
                            },
                            demande
                        });
                    }

                    return acc;
                }, []);
            }),
            // send all demande to API
            mergeMap((data: Array<{apiData: DemandeForApi, demande: DemandeLivraison}>) => {
                if (!data || data.length === 0) {
                    throw {success: false, message: 'Aucune demande de livraison à synchroniser'};
                }
                return this.requestApiForDeliveryRequests(data);
            }),
            // sync
            mergeMap((data: Array<{success: boolean; message: string; demande: DemandeLivraison}>) => {
                const sortedData: {success: Array<number>, errors: Array<DemandeLivraison>} = data.reduce(
                    (acc: any, {success, message, demande}) => {
                        if (success) {
                            acc.success.push(demande.id);
                        }
                        else {
                            acc.errors.push({
                                ...demande,
                                last_error: message
                            } as DemandeLivraison);
                        }
                        return acc;
                    },
                    {success: [], errors: []}
                );

                const errors = sortedData.errors.filter(({id}) => id);

                return (sortedData.success.length > 0 || errors.length > 0)
                    ? zip(
                        ...(
                            sortedData.success.length > 0
                                ? [
                                    this.sqliteService.deleteBy('demande_livraison', [`id IN (${sortedData.success.join(',')})`]),
                                    this.sqliteService.deleteBy('article_in_demande_livraison', [`demande_id IN (${sortedData.success.join(',')})`])
                                ]
                                : []
                        ),
                        ...(
                            errors.length > 0
                                ? errors.map(({id, last_error}) => (
                                    this.sqliteService.update('demande_livraison', [{values: {last_error}, where: [`id = ${id}`]}])
                                ))
                                : []
                        )
                    ).pipe(map(() => sortedData))
                    : of (sortedData)
            }),
            // we sync DL data
            mergeMap((serviceRes) => (
                this.apiService
                    .requestApi(ApiService.GET_DEMANDE_LIVRAISON_DATA)
                    .pipe(
                        mergeMap(({data}) => this.sqliteService.importDemandesLivraisonData(data)),
                        map(() => serviceRes)
                    )
            ))
        );
    }

    private presentAlertError(title: string,
                              numeroFailedName: string,
                              errors: Array<{[numeros: string]: string, message: string}>): void {
        this.alertService.show({
            header: title,
            cssClass: AlertService.CSS_CLASS_MANAGED_ALERT,
            message: errors.map(({message, ...numeros}) => `${numeros[numeroFailedName]} : ${message}`).join(`\n`),
            buttons: [{
                text: 'Valider',
                cssClass: 'alert-success'
            }]
        });
    }

    private requestApiForDeliveryRequests([first, ...remaining]: Array<{apiData: DemandeForApi, demande: DemandeLivraison}>): Observable<Array<{success: boolean; message: string; demande: DemandeLivraison}>> {
        return !first
            ? of([])
            : this.apiService
                .requestApi(ApiService.POST_DEMANDE_LIVRAISON, {params: {demande: first.apiData}})
                .pipe(
                    map(({success, nomadMessage}) => ({
                        success,
                        message: nomadMessage,
                        demande: first.demande
                    })),
                    catchError((requestResult) => of(requestResult)),
                    mergeMap((requestResult: {success: boolean; message: string; demande: DemandeLivraison}) => (
                        this.requestApiForDeliveryRequests(remaining).pipe(map((res) => ([
                            requestResult,
                            ...res
                        ])))
                    ))
                );
    }

    public mapTrackingMovements(movements: Array<MouvementTraca & {subPacks?: any}>, indexAttachments: boolean = false) {
        return movements
            .sort(({date: dateStr1}, {date: dateStr2}) => {
                const date1 = new Date(dateStr1.split('_')[0]);
                const date2 = new Date(dateStr2.split('_')[0]);
                return date1.getTime() <= date2.getTime()
                    ? -1
                    : 1;
            })
            .map(({signature, photo, ...mouvement}, index) => ({
                ...mouvement,
                signature: signature
                    ? this.fileService.createFile(
                        signature,
                        FileService.SIGNATURE_IMAGE_EXTENSION,
                        FileService.SIGNATURE_IMAGE_TYPE,
                        `signature${indexAttachments ? `_${index}` : ''}`
                    )
                    : undefined,
                photo: photo
                    ? this.fileService.createFile(
                        photo,
                        FileService.SIGNATURE_IMAGE_EXTENSION,
                        FileService.SIGNATURE_IMAGE_TYPE,
                        `photo${indexAttachments ? `_${index}` : ''}`
                    )
                    : undefined
            }) as MouvementTraca<File>);
    }

    public mapDispatchPacks(packs: Array<DispatchPack>) {
        const packsWithFiles = packs
            .map(({photo1, photo2, id, natureId, quantity, dispatchId, code}) => ({
                id,
                natureId,
                quantity,
                dispatchId,
                code,
                photo1: photo1
                    ? this.fileService.createFile(
                        photo1,
                        FileService.SIGNATURE_IMAGE_EXTENSION,
                        FileService.SIGNATURE_IMAGE_TYPE,
                        `${code}_photo1`
                    )
                    : undefined,
                photo2: photo2
                    ? this.fileService.createFile(
                        photo2,
                        FileService.SIGNATURE_IMAGE_EXTENSION,
                        FileService.SIGNATURE_IMAGE_TYPE,
                        `${code}_photo2`
                    )
                    : undefined
            }) as any);
        return {
            dispatchPacks: packsWithFiles.map(({photo1, photo2, code, ...pack}) => pack),
            ...(packsWithFiles.reduce((acc, {photo1, photo2, code}, currentIndex) => ({
                ...acc,
                ...(photo1 ? {[`${code}_photo1`]: photo1} : {}),
                ...(photo2 ? {[`${code}_photo2`]: photo2} : {}),
            }), {})),
        };
    }

    public extractTrackingMovementFiles(movements: Array<MouvementTraca<File> & {subPacks?: any}>, createTakeAndDrop: boolean = false) {
        return {
            mouvements: movements.map(({signature, photo, ...mouvement}) => mouvement),
            ...(movements.reduce((acc, {signature}, currentIndex) => ({
                ...acc,
                ...(signature ? {[`signature_${currentIndex}`]: signature} : {})
            }), {})),
            ...(movements.reduce((acc, {photo}, currentIndex) => ({
                ...acc,
                ...(photo ? {[`photo_${currentIndex}`]: photo} : {})
            }), {})),
            createTakeAndDrop
        };
    }

    private updateSucceedTracking(refArticlesErrors: any, mouvements: any) {
        const mouvementTracaToDelete = mouvements
            .filter(({finished, type, ref_article}: any) => (
                (finished && (refArticlesErrors.indexOf(ref_article) === -1)) ||
                (type === 'depose')
            ))
            .map(({id}: any) => id);
        return this.sqliteService.findBy('mouvement_traca', [`id IN (${mouvementTracaToDelete.join(',')}) AND packGroup IS NOT NULL`])
            .pipe(
                mergeMap((trackingToDelete: Array<MouvementTraca>) => {
                    const subPacksToDelete = trackingToDelete.map(({ref_article}) => ref_article);
                    return subPacksToDelete && subPacksToDelete.length > 0
                        ? this.sqliteService
                            .findBy('mouvement_traca', [
                                'isGroup = 1',
                                subPacksToDelete
                                    .map((code) => `subPacks LIKE '%${code}%'`)
                                    .join(' OR ')
                            ])
                            .pipe(
                                mergeMap((groupsToUpdate) => groupsToUpdate.length > 0
                                    ? this.sqliteService.update(
                                        'mouvement_traca',
                                        // remove duplicates
                                        groupsToUpdate
                                            .filter(({id}: MouvementTraca, index: number) => groupsToUpdate.findIndex(({id: idDuplicate}: MouvementTraca) => idDuplicate === id) === index)
                                            .map((group: MouvementTraca) => {
                                                const subPacks = JSON.parse(group.subPacks || '[]');
                                                const newSubPacks: Array<any> = [];
                                                for (const pack of subPacks) {
                                                    if (trackingToDelete.findIndex(({ref_article: trackingToDeleteCode}) => (trackingToDeleteCode === pack.code)) === -1) {
                                                        newSubPacks.push(pack);
                                                    }
                                                }
                                                group.subPacks = JSON.stringify(newSubPacks);
                                                return {
                                                    values: group,
                                                    where: [`id = ${group.id}`]
                                                };
                                            })
                                    )
                                    : of(undefined)
                                )
                            )
                        : of (undefined)
                }),
                mergeMap(() => this.sqliteService.deleteBy('mouvement_traca', [`id IN (${mouvementTracaToDelete.join(',')})`])),

            );
    }
}
