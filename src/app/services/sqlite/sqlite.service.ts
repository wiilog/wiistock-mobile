import {Injectable} from '@angular/core';
import {StorageService} from '@app/services/storage/storage.service';
import {Livraison} from '@entities/livraison';
import {from, Observable, of, zip} from 'rxjs';
import {mergeMap, map, take, tap, catchError} from 'rxjs/operators';
import {Handling} from '@entities/handling';
import {MouvementTraca} from '@entities/mouvement-traca';
import {Anomalie} from "@entities/anomalie";
import {ArticlePrepaByRefArticle} from "@entities/article-prepa-by-ref-article";
import {ArticleCollecte} from "@entities/article-collecte";
import {ArticleLivraison} from "@entities/article-livraison";
import * as moment from 'moment';
import {keptTablesOnConnection, TablesDefinitions} from '@app/services/sqlite/tables-definitions';
import {TableName} from '@app/services/sqlite/table-definition';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {DemandeLivraisonArticle} from '@entities/demande-livraison-article';
import {CapacitorSQLite, CapacitorSQLitePlugin} from '@capacitor-community/sqlite';

@Injectable({
    providedIn: 'root'
})
export class SqliteService {

    private static readonly DB_NAME: string = 'wiistock_db';

    private readonly sqlite: CapacitorSQLitePlugin;

    public constructor(private storageService: StorageService) {
        this.sqlite = CapacitorSQLite;
    }

    // private retrieveDBConnection(): Observable<void> {
    //     if (this.db) {
    //         return of(undefined);
    //     }
    //     else {
    //         return from(this.sqlite.checkConnectionsConsistency())
    //             .pipe(
    //                 mergeMap(() => from(this.sqlite.isConnection(SqliteService.DB_NAME, false))),
    //                 mergeMap(({result}) => (
    //                     result
    //                         ? from(this.sqlite.retrieveConnection(SqliteService.DB_NAME, false))
    //                         : from(this.sqlite.createConnection(SqliteService.DB_NAME, false, 'no-encryption', 1, false))
    //                 )),
    //                 tap((db: SQLiteDBConnection) => {
    //                     if (!db) {
    //                         throw new Error(`Database returned is null`);
    //                     }
    //                     // save database connexion for next queries
    //                     this.db = db;
    //                 }),
    //                 map(() => undefined)
    //             );
    //     }
    // }

   /* private ensureDBIsOpened(): Observable<void> {
        if (this.db) {
            return from(this.db.isDBOpen()).pipe(
                mergeMap(({result}) => {
                    if (!this.db) {
                        throw new Error('You had to retrieve connection before');
                    }
                    return !result
                            ? from(this.db.open())
                            : of(undefined)
                })
            );
        }
        else {
            throw new Error('You had to retrieve connection before');
        }
    }*/


    public resetDataBase(force: boolean = false): Observable<void> {
        return this.clearDatabase(force)
            .pipe(
                mergeMap(() => this.createDatabase()),
            );
    }

    private createDatabase(): Observable<void> {
        const createDatabaseRequests = TablesDefinitions.map(({name, schema}) => {
            const attributesStr = schema
                .map(({column, value}) => (`\`${column}\` ${value}`))
                .join(', ');
            return `CREATE TABLE IF NOT EXISTS \`${name}\` (${attributesStr})`;
        });

        return createDatabaseRequests.length > 0
            ? zip(...createDatabaseRequests.map((statement) => this.execute(statement)))
                .pipe(map(() => undefined))
            : of(undefined);
    }

    private clearDatabase(force: boolean): Observable<void> {
        const tableNamesToDrop: Array<string> = SqliteService.GetTableNames()
            .filter((name) => (force || keptTablesOnConnection.indexOf(name) === -1))
            .map((name) => `DROP TABLE IF EXISTS \`${name}\``);
        return tableNamesToDrop.length > 0
            ? zip(...tableNamesToDrop.map((dropStatement) => this.execute(dropStatement)))
                .pipe(map(() => undefined))
            : of(undefined);
    }

    /**
     * @return TRUE if the connection was opened or has been opened. FALSE if database does not exist
     */
    private ensureDatabaseOpened(): Observable<boolean> {
        return from(this.sqlite.isDBOpen({database: SqliteService.DB_NAME})).pipe(
            catchError(() => of(this.sqlite.createConnection({database: SqliteService.DB_NAME})).pipe(
                map(() => ({result: false}))
            )),
            mergeMap(({result}) => !result
                ? from(this.sqlite.open({database: SqliteService.DB_NAME})).pipe(map(() => true))
                : of(true)
            ),
        );
    }

    private static JoinWhereClauses(where: Array<string>): string {
        const whereJoined = where
            .map((clause) => `(${clause})`)
            .join(' AND ');
        return `(${whereJoined})`;
    }

    private static GetTableNames(): Array<TableName> {
        return TablesDefinitions.map(({name}) => name);
    }

    public execute(statement: string): Observable<{ changes?: number, lastId?: number}> {
        return this.ensureDatabaseOpened()
            .pipe(
                // we use run instead of execute to retrieve last insert id
                mergeMap(() => from(this.sqlite.run({
                    database: SqliteService.DB_NAME,
                    statement,
                    values: [],
                }))),
                map((result) => result?.changes || {}),
                // print queries on SQLite errors
                tap({
                    error: (error) => {
                        console.error(`SqliteService::execute >> ${statement}`, error);
                    }
                }),
            );
    }


    public query<T = any>(query: string): Observable<Array<T>> {
        return this.ensureDatabaseOpened()
            .pipe(
                mergeMap(() => from(this.sqlite.query({
                    database: SqliteService.DB_NAME,
                    statement: query,
                    values: []
                }))),
                map((result) => result?.values || []),
                // print queries on SQLite errors
                tap({
                    error: (error) => {
                        console.error(`SqliteService::query >> ${query}`, error);
                    }
                }),
            );
    }

    public insert<T = any>(name: TableName, objects: T|Array<T>): Observable<number|undefined> {
        if (objects
            && (
                !Array.isArray(objects)
                || objects.length > 0
            )) {
            let query = this.createInsertQuery(name, objects);
            return this.execute(query).pipe(map(({lastId}) => lastId));
        }
        else {
            return of(undefined);
        }
    }

    public update(name: TableName, config: Array<{values: any, where?: Array<string>}>): Observable<any> {
        const queries = config
            .map(({values, where}) => this.createUpdateQuery(name, values, where || []))
            .filter((query) => query) as Array<string>;
        return queries.length > 0
            ? this.execute(queries.join(';'))
            : of(false);
    }


    /**
     * find all elements in the given table which correspond to the given where clauses.
     * @param {string} table name of the table to do the search
     * @param {string[]} where boolean clauses to apply with AND separator
     * @param {Object.<string,'ASC'|'DESC'>} order
     * @param {number|undefined} limit
     * @param {number|undefined} offset
     */
    public findBy<T = any>(table: TableName,
                           where: Array<string> = [],
                           order: {[column: string]: 'ASC'|'DESC'} = {},
                           {limit, offset}: { limit?: number, offset?: number } = {}): Observable<Array<T>> {
        const sqlWhereClauses = (where && where.length > 0)
            ? ` WHERE ${SqliteService.JoinWhereClauses(where)}`
            : undefined;

        const orderByArray = Object
            .keys(order || {})
            .map((column: string) => `${column} ${order[column]}`)

        const sqlOrderByClauses = (orderByArray && orderByArray.length > 0)
            ? ` ORDER BY ${orderByArray.join(',')}`
            : undefined;

        const offsetClause = offset ? ` OFFSET ${offset}` : '';
        const limitClause = limit ? ` LIMIT ${limit}${offsetClause}` : undefined;

        const sqlQuery = `SELECT * FROM ${table}${sqlWhereClauses || ''}${sqlOrderByClauses || ''}${limitClause || ''}`;

        return this.query<T>(sqlQuery);
    }

    public findAll<T = any>(table: TableName): Observable<Array<T>> {
        return this.findBy<T>(table);
    }

    public count(table: TableName, where: string[] = []): Observable<number> {
        let whereClause = (where && where.length > 0)
            ? ` WHERE ${where.map((condition) => `(${condition})`).join(' AND ')}`
            : '';

        let query = `SELECT COUNT(*) AS counter FROM ${table}${whereClause}`;

        return this.query(query)
            .pipe(
                map((data) => {
                    const {counter} = data[0] || {};
                    return Number(counter || 0);
                })
            );
    }

    public findOneById<T = any>(table: TableName, id: number): Observable<T|null> {
        return this.findOneBy<T>(table, {id});
    }

    public findOneBy<T = any>(table: TableName, conditions: {[name: string]: any}, glue: string = 'OR'): Observable<T|null> {
        const condition = Object
            .keys(conditions)
            .map((name) => `${name} ${this.getComparatorForQuery(conditions[name])} ${this.getValueForQuery(conditions[name])}`)
            .join(` ${glue} `);

        return this.query<T>(`SELECT * FROM ${table} WHERE ${condition}`).pipe(
            map((data) => data[0] || null)
        );
    }

    public deleteBy(table: TableName,
                    where: Array<string> = []): Observable<undefined> {
        const sqlWhereClauses = (where && where.length > 0)
            ? `WHERE ${SqliteService.JoinWhereClauses(where)}`
            : '';
        return this.execute(`DELETE FROM ${table} ${sqlWhereClauses};`).pipe(map(() => undefined));;
    }

    private importLocations(data: any): Observable<any> {
        let apiEmplacements = data['locations'];
        const filled = (apiEmplacements && apiEmplacements.length > 0);

        return filled
            ? this
                .deleteBy('emplacement')
                .pipe(mergeMap(() => this.insert('emplacement', apiEmplacements)))
            : of(undefined);
    }

    private importDispatchesData(data: any): Observable<any> {
        const dispatches = data['dispatches'] || [];
        const dispatchPacks = data['dispatchPacks'] || [];

        return zip(
            this.deleteBy('dispatch'),
            this.deleteBy('dispatch_pack')
        )
            .pipe(
                mergeMap(() => (
                    dispatches.length > 0
                        ? this.insert('dispatch', dispatches)
                        : of(undefined)
                )),
                mergeMap(() => (
                    dispatchPacks.length > 0
                        ? this.insert('dispatch_pack', dispatchPacks)
                        : of(undefined)
                ))
            );
    }

    public importPreparations(data: any, deleteOld: boolean = true): Observable<any> {
        const preparations = (data['preparations'] || []);
        const articlesPrepaApi = (data['articlesPrepa'] || []);
        const preparationIds = preparations.map(({id}: any) => id);

        return of(undefined).pipe(
            mergeMap(() => deleteOld ? this.deleteBy('preparation') : of(undefined)),
            mergeMap(() => this.insert(
                'preparation',
                preparations.map(({number, ...preparation}: any) => ({started: 0, numero: number, ...preparation}))
            )),

            // articlePrepa
            mergeMap(() => (
                preparationIds.length > 0
                    ? this.findBy('article_prepa', [`id_prepa IN (${preparationIds.join(',')})`, `deleted <> 1`])
                        .pipe(
                            mergeMap((articles) => {
                                const articlesToInsert = articlesPrepaApi
                                    .filter((toInsert: any) => (
                                        articles.every((articlePrepa: any) => (
                                            (articlePrepa.id_prepa !== toInsert.id_prepa) ||
                                            (articlePrepa.reference !== toInsert.reference)
                                        ))
                                    ))
                                    .map((toInsert: any) => ({
                                        label: toInsert.label,
                                        reference: toInsert.reference,
                                        quantite: toInsert.quantity,
                                        is_ref: toInsert.is_ref,
                                        id_prepa: toInsert.id_prepa,
                                        has_moved: 0,
                                        emplacement: toInsert.location,
                                        type_quantite: toInsert.type_quantite,
                                        barcode: toInsert.barCode,
                                        original_quantity: toInsert.quantity,
                                        reference_article_reference: toInsert.reference_article_reference,
                                        targetLocationPicking: toInsert.targetLocationPicking,
                                        lineLogisticUnitId: toInsert.lineLogisticUnitId,
                                        lineLogisticUnitCode: toInsert.lineLogisticUnitCode,
                                        lineLogisticUnitNatureId: toInsert.lineLogisticUnitNatureId,
                                        lineLogisticUnitLocation: toInsert.lineLogisticUnitLocation,
                                    }))
                                ;

                                return this.insert('article_prepa', articlesToInsert);
                            }))
                    : of(undefined)
            ))
        );
    }

    public importHandlings(data: any): Observable<any> {
        let handlings = data['handlings'];
        let handlingAttachments = data['handlingAttachments'];

        return zip(
            this.deleteBy('handling'),
            this.deleteBy('handling_attachment')
        )
            .pipe(
                mergeMap(() => this.findAll('handling')),
                mergeMap((alreadyInserted: Array<Handling>) => {
                    const alreadyInsertedIds = alreadyInserted.map(({id}) => Number(id));
                    const handlingsToInsert = handlings.filter(({id}: any) => (alreadyInsertedIds.indexOf(Number(id)) === -1));
                    const handlingsToUpdate = handlings.filter(({id}: any) => (alreadyInsertedIds.indexOf(Number(id)) > -1));
                    return handlingsToInsert.length > 0 || handlingsToUpdate.length > 0
                        ? zip(
                            handlingAttachments.length > 0
                                ? this.insert('handling_attachment', handlingAttachments)
                                : of(undefined),
                            handlingsToInsert.length > 0
                                ? this.insert('handling', handlingsToInsert)
                                : of(undefined),
                            handlingsToUpdate.length > 0
                                ? this.update(
                                    'handling',
                                    handlingsToUpdate.map(({id, ...handling}: any) => ({values: handling, where: [`where id = ${id}`]}))
                                )
                                : of(undefined)
                        )
                        : of(undefined);
                }),
                map(() => undefined)
            );
    }

    public importTransferOrderData(data: any): Observable<any> {
        const transferOrders = data['transferOrders'];
        const transferOrderArticles = data['transferOrderArticles'];

        return zip(
            this.deleteBy('transfer_order'),
            this.deleteBy('transfer_order_article')
        )
            .pipe(
                mergeMap(() => (
                    transferOrders && transferOrders.length > 0
                        ? this.insert('transfer_order', transferOrders.map((transferOrder: any) => ({treated: 0, ...transferOrder})))
                        : of(undefined)
                )),
                mergeMap(() => (
                    transferOrderArticles && transferOrderArticles.length > 0
                        ? this.insert('transfer_order_article', transferOrderArticles)
                        : of(undefined)
                )),
                map(() => undefined)
            );
    }

    public importTransportRoundData(data: any): Observable<any> {
        const transportRounds = data['transportRounds'];
        const transportRoundLines = data['transportRoundLines'];

        return zip(
            this.deleteBy('transport_round'),
            this.deleteBy('transport_round_line')
        )
            .pipe(
                mergeMap(() => (
                    transportRounds && transportRounds.length > 0
                        ? this.insert('transport_round', transportRounds)
                        : of(undefined)
                )),
                mergeMap(() => (
                    transportRoundLines && transportRoundLines.length > 0
                        ? this.insert('transport_round_line', transportRoundLines)
                        : of(undefined)
                )),
                map(() => undefined)
            );
    }

    public importMouvementTraca(data: any): Observable<any> {
        const apiTaking = [
            ...(data['trackingTaking'] || []),
            ...(data['stockTaking'] || [])
        ];

        return (apiTaking && apiTaking.length > 0)
            ? this.findBy('mouvement_traca', ['finished <> 1', `type LIKE 'prise'`])
                .pipe(mergeMap((prises: Array<MouvementTraca>) => (
                    apiTaking.length > 0
                        ? zip(
                            ...apiTaking.map((apiPicking) => (
                                !prises.some(({date}) => (date === apiPicking.date))
                                    ? this.insert('mouvement_traca', {
                                        ...apiPicking,
                                        isGroup: (apiPicking.isGroup || false),
                                        subPacks: (apiPicking.subPacks || [])
                                    })
                                    : this.update(
                                        'mouvement_traca',
                                        [{
                                            values: {subPacks: (apiPicking.subPacks || [])},
                                            where: [`ref_article = '${apiPicking.ref_article}'`]
                                        }]
                                    )
                            ))
                        )
                        : of(undefined)
                )))
            : of(undefined);
    }

    public importDemandesLivraisonData(data: any): Observable<void> {
        const demandeLivraisonArticles = data['demandeLivraisonArticles'] || [];
        const demandeLivraisonTypes = data['demandeLivraisonTypes'] || [];
        // On supprimer tous les types
        return zip(
            this.findAll('article_in_demande_livraison'),
            this.findAll('demande_livraison')
        )
            .pipe(
                // On garde les types qui sont dans des demandes en brouillon
                //  --> on supprime les types qui sont dans la liste du getDataArray ET ceux qui ne sont pas dans des demandes en brouillon
                // On garde les articles qui sont dans des demandes en brouillon
                //  --> on supprime les articles qui sont dans la liste du getDataArray ET ceux qui ne sont pas dans des demandes en brouillon
                mergeMap(([articleBarCodesInDemande, demandeLivraisonInDB]: [Array<{bar_code: string}>, Array<{type_id: number}>]) => {
                    const demandeLivraisonArticlesBarCodesToImport = demandeLivraisonArticles.map(({bar_code}: any) => `'${bar_code}'`);
                    const articleBarCodesInDemandeBarCodes = articleBarCodesInDemande.map(({bar_code}) => `'${bar_code}'`);

                    const demandeLivraisonTypesIdsToImport = demandeLivraisonTypes.map(({id}: any) => id); // les ids des types à importer
                    const typeIdsInDemandes = demandeLivraisonInDB.reduce((acc: Array<number>, {type_id}) => {
                        if (acc.indexOf(type_id) === -1) {
                            acc.push(type_id);
                        }
                        return acc;
                    }, []); // les ids des types dans les demandes

                    return zip(
                        (demandeLivraisonTypesIdsToImport.length > 0 || typeIdsInDemandes.length > 0)
                            ? this.deleteBy('demande_livraison_type', [
                                [
                                    demandeLivraisonTypesIdsToImport.length > 0 ? `(id IN (${demandeLivraisonTypesIdsToImport.join(',')}))` : '',
                                    typeIdsInDemandes.length > 0 ? `(id NOT IN (${typeIdsInDemandes.join(',')}))` : ''
                                ]
                                    .filter(Boolean)
                                    .join(' OR ')
                            ])
                            : of(undefined),
                        (demandeLivraisonArticlesBarCodesToImport.length > 0 || articleBarCodesInDemandeBarCodes.length > 0)
                            ? this.deleteBy('demande_livraison_article', [
                                [
                                    demandeLivraisonArticlesBarCodesToImport.length > 0 ? `(bar_code IN (${demandeLivraisonArticlesBarCodesToImport.join(',')}))` : '',
                                    articleBarCodesInDemandeBarCodes.length > 0 ? `(bar_code NOT IN (${articleBarCodesInDemandeBarCodes.join(',')}))` : ''
                                ]
                                    .filter(Boolean)
                                    .join(' OR ')
                            ])
                            : of(undefined)
                    );
                }),
                mergeMap(() => zip(
                    this.update('demande_livraison_article', [{values: {to_delete: true}}]),
                    this.update('demande_livraison_type', [{values: {to_delete: true}}])
                )),
                mergeMap(() => (
                    ((demandeLivraisonArticles && demandeLivraisonArticles.length > 0) || (demandeLivraisonTypes && demandeLivraisonTypes.length > 0))
                        ? zip(
                            this.insert('demande_livraison_article', demandeLivraisonArticles || []),
                            this.insert('demande_livraison_type', demandeLivraisonTypes || []),
                        )
                        : of(undefined)
                )),
                map(() => undefined),
            );
    }

    public importNaturesData(data: any, clearAll: boolean = true): Observable<void> {
        const natures = data['natures'] || [];

        if (clearAll) {
            return this.deleteBy('nature')
                .pipe(
                    mergeMap(() => this.insert('nature', natures)),
                    map(() => undefined)
                );
        } else {
            const naturesInsert = natures.map(({id, ...remainingNature}: any) => {
                return mergeMap(() => (
                    this.deleteBy('nature', [`id = ${id}`])
                        .pipe(
                            mergeMap(() => this.insert('nature', {id, ...remainingNature}))
                        )
                ))
            });
            if (naturesInsert.length === 0) {
                naturesInsert.push(map(() => undefined));
            }
            return zip(
                // @ts-ignore
                of(undefined).pipe(...naturesInsert)
            )
                .pipe(map(() => undefined));
        }
    }

    public importAllowedNaturesData(data: any): Observable<void> {
        const allowedNatureInLocations = data['allowedNatureInLocations'] || [];
        return this.deleteBy('allowed_nature_location').pipe(
            mergeMap(() => (
                allowedNatureInLocations.length > 0
                    ? this.insert('allowed_nature_location', allowedNatureInLocations)
                    : of(undefined)
            )),
            map(() => undefined)
        );
    }

    public importDispatchTypes(data: any): Observable<void> {
        const dispatchTypes = data['dispatchTypes'] || [];
        return this.deleteBy('dispatch_type').pipe(
            mergeMap(() => (
                dispatchTypes.length > 0
                    ? this.insert('dispatch_type', dispatchTypes)
                    : of(undefined)
            )),
            map(() => undefined)
        );
    }

    public importUsers(data: any): Observable<void> {
        const users = data['users'] || [];
        return this.deleteBy('user').pipe(
            mergeMap(() => (
                users.length > 0
                    ? this.insert('user', users)
                    : of(undefined)
            )),
            map(() => undefined)
        );
    }

    public importStatusData(data: any): Observable<void> {
        const status = data['status'] || [];
        return this.deleteBy('status').pipe(
            mergeMap(() => (
                status.length > 0
                    ? this.insert('status', status)
                    : of(undefined)
            )),
            map(() => undefined)
        );
    }

    public importProjects(data: any): Observable<void> {
        const projects = data.projects || [];
        return this.deleteBy('project').pipe(
            mergeMap(() => (
                projects.length > 0
                    ? this.insert('project', projects)
                    : of(undefined)
            )),
            map(() => undefined)
        );
    }

    public importFreeFieldsData(data: any): Observable<void> {
        // for multiple types
        const freeFields = data['freeFields'] || [];

        return of(undefined).pipe(
            mergeMap(() => this.deleteBy('free_field')),
            mergeMap(() => (
                (freeFields.length > 0)
                    ? this.insert('free_field', freeFields)
                    : of(undefined)
            )),
            map(() => undefined),
        );

    }

    public importLivraisons(data: any): Observable<any> {
        const apiDeliveryOrder: Array<Livraison> = data['livraisons'];
        const apiDeliveryOrderArticle: Array<ArticleLivraison> = data['articlesLivraison'];

        const ordersToInsert = apiDeliveryOrder
            ? apiDeliveryOrder.map(({id}) => id)
            : [];

        return zip(
            this.deleteBy('livraison'),
            this.findAll('article_livraison')
        )
            .pipe(
                mergeMap(([_, existingDeliveryOrderArticle]: [any, Array<ArticleLivraison>]) => {
                    // if article already exists we do not inset it
                    const deliveryOrderArticlesToInsert = apiDeliveryOrderArticle.filter((toInsert) => (
                        !existingDeliveryOrderArticle.some((existing) => (
                            (Number(existing.is_ref) === Number(toInsert.is_ref))
                            && (Number(existing.id_livraison) === Number(toInsert.id_livraison))
                            && (existing.reference === toInsert.reference)
                        ))
                    ));

                    return zip(
                        // orders insert
                        apiDeliveryOrder && apiDeliveryOrder.length > 0
                            ? this.insert('livraison', apiDeliveryOrder)
                            : of(undefined),

                        // articles insert
                        deliveryOrderArticlesToInsert && deliveryOrderArticlesToInsert.length > 0
                            ? this.insert('article_livraison', deliveryOrderArticlesToInsert.map((article) => ({has_moved: 0, ...article})))
                            : of(undefined)
                    );
                }),
                // remove unused articles
                mergeMap(() => (
                    ordersToInsert.length > 0
                        ? this.deleteBy('article_livraison', [`id_livraison NOT IN (${ordersToInsert.join(',')})`])
                        : of(undefined)
                ))
            );
    }

    /**
     * Import in sqlite api data from collectes and articlesCollecte fields
     * @param data
     */
    public importCollectes(data: any): Observable<any> {
        const collectesAPI = data['collectes'];
        const articlesCollecteAPI = data['articlesCollecte'];

        return of(undefined).pipe(
            mergeMap(() => this.deleteBy('collecte')),
            mergeMap(() => this.deleteBy('article_collecte')),

            mergeMap(() => (
                collectesAPI.length > 0
                    ? this.insert('collecte', collectesAPI
                        .map(({id, number, location_from, forStock, requester, type, comment}: any) => ({
                            id,
                            number,
                            location_from,
                            forStock,
                            requester,
                            type,
                            comment
                        })))
                    : of(undefined)
            )),
            mergeMap(() => (
                (articlesCollecteAPI && articlesCollecteAPI.length > 0)
                    ? this.insert('article_collecte', articlesCollecteAPI.map(({label, quantity_type, reference, quantity, is_ref, id_collecte, location, barCode, reference_label}: any) => ({
                        label,
                        reference,
                        is_ref,
                        id_collecte,
                        quantity_type,
                        emplacement: location,
                        barcode: barCode,
                        reference_label,
                        quantite: quantity,
                        has_moved: 0,
                    })))
                    : of(undefined)
            )),
            map(() => undefined)
        );
    }

    /**
     * Send sql values for insert the article_collecte
     */
    public getArticleCollecteValueFromApi(articleCollecte: any): string {
        return (
            "(NULL, " +
            "'" + this.escapeQuotes(articleCollecte.label) + "', " +
            "'" + this.escapeQuotes(articleCollecte.reference) + "', " +
            articleCollecte.quantity + ", " +
            articleCollecte.is_ref + ", " +
            articleCollecte.id_collecte + ", " +
            "0, " +
            "'" + this.escapeQuotes(articleCollecte.location) + "', " +
            "'" + articleCollecte.barCode + "', " +
            "'" + articleCollecte.reference_label + "')"
        );
    }

    /**
     * Create Sql query to insert given sqlValues
     */
    public getArticleCollecteInsertQuery(articlesCollecteValues: Array<string>): string {
        return (
            'INSERT INTO `article_collecte` (' +
            '`id`, ' +
            '`label`, ' +
            '`reference`, ' +
            '`quantite`, ' +
            '`is_ref`, ' +
            '`id_collecte`, ' +
            '`has_moved`, ' +
            '`emplacement`, ' +
            '`barcode`, ' +
            '`reference_label`' +
            ') ' +
            'VALUES ' + articlesCollecteValues.join(',') + ';'
        );
    }

    public importArticlesInventaire(data: any): Observable<any> {
        let articlesInventaire = data['inventoryMission'];
        return this.deleteBy('article_inventaire')
            .pipe(
                mergeMap(() => (
                    (articlesInventaire && articlesInventaire.length > 0)
                        ? this.insert('article_inventaire', articlesInventaire.map(({
                                                                                        mission_id,
                                                                                        reference,
                                                                                        is_ref,
                                                                                        location,
                                                                                        barCode,
                                                                                        type,
                                                                                        done,
                                                                                        mission_start,
                                                                                        mission_end,
                                                                                        mission_name,
                                                                                        logistic_unit_code,
                                                                                        logistic_unit_id,
                                                                                        logistic_unit_nature,
                                                                                    }: any) => ({
                            mission_id,
                            mission_start,
                            mission_end,
                            mission_name,
                            reference,
                            is_ref,
                            type,
                            done,
                            location: location ? location : 'N/A',
                            barcode: barCode,
                            logistic_unit_code,
                            logistic_unit_id,
                            logistic_unit_nature,
                        })))
                        : of(undefined)
                ))
            );
    }

    public importArticlesPrepaByRefArticle(data: any, partial: boolean = false): Observable<any> {
        const articlesPrepaByRefArticle: Array<ArticlePrepaByRefArticle> = data['articlesPrepaByRefArticle'];
        return of(undefined)
            .pipe(
                mergeMap(() => (
                    partial
                        ? this.findAll('article_prepa_by_ref_article')
                        : this.deleteBy('article_prepa_by_ref_article').pipe(map(() => ([])))
                )),
                mergeMap((articlesInDatabase: Array<ArticlePrepaByRefArticle>) => {
                    // On supprimer les refArticleByRefarticle dont le champ reference_article est renvoyé par l'api
                    const refArticleToDelete = (articlesInDatabase.length > 0 ? (articlesPrepaByRefArticle || []) : [])
                        .reduce((acc: Array<string>, {reference_article}: any) => {
                            if (acc.indexOf(reference_article) === -1) {
                                acc.push(reference_article);
                            }
                            return acc;
                        }, [])
                        .map((reference) => `'${reference}'`);
                    return refArticleToDelete.length > 0
                        ? this.deleteBy('article_prepa_by_ref_article', [`reference_article IN (${refArticleToDelete})`])
                        : of(undefined)
                }),
                mergeMap(() => (
                    (articlesPrepaByRefArticle && articlesPrepaByRefArticle.length > 0)
                        ? this.insert('article_prepa_by_ref_article', articlesPrepaByRefArticle.map((article) => ({
                            ...article,
                            isSelectableByUser: 1
                        })))
                        :  of(undefined)
                ))
            );
    }

    public importAnomaliesInventaire(data: any, deleteOldAnomalies: boolean = true): Observable<any> {
        let anomalies = data.anomalies;

        return (deleteOldAnomalies
            ? this.deleteBy('anomalie_inventaire').pipe(map(() => ([])))
            : this.findAll('anomalie_inventaire'))
            .pipe(
                mergeMap((oldAnomalies: Array<Anomalie>) => {
                    // we check if anomalies are not already in local database
                    const anomaliesToInsert = anomalies
                        .filter(({id}: any) => oldAnomalies.every(({id: oldAnomaliesId}) => (Number(id) !== Number(oldAnomaliesId))));
                    return anomaliesToInsert.length > 0
                        ? this.insert('anomalie_inventaire', anomaliesToInsert.map((anomaly: any) => ({
                            location: anomaly.location ? anomaly.location : 'N/A',
                            is_treatable: anomaly.isTreatable,
                            barcode: anomaly.barCode,
                            id: anomaly.id,
                            reference: anomaly.reference,
                            mission_id: anomaly.mission_id,
                            mission_name: anomaly.mission_name,
                            mission_start: anomaly.mission_start,
                            mission_end: anomaly.mission_end,
                            is_ref: anomaly.is_ref,
                            quantity: anomaly.quantity,
                            countedQuantity: anomaly.countedQuantity,
                        })))
                        : of(undefined);
                })
            );
    }

    private importTranslations(data: any): Observable<any> {
        const translations = data.translations;

        return this.deleteBy('translations')
            .pipe(
                mergeMap(() => (
                    translations.length === 0
                        ? of(undefined)
                        : this.insert('translations', translations.map(({topMenu, subMenu, menu, label, translation}: any) => ({topMenu, subMenu, menu, label, translation})))
                            .pipe(map(() => true))
                ))
            );
    }

    public importData(data: any): Observable<any> {
        console.error('WWWWWWWWWWWWWWWWWWWWWW'  , "import dataxx !!!")
        return of(undefined).pipe(
            mergeMap(() => this.importLocations(data).pipe(tap(() => {console.log('--- > importLocations')}))),
            mergeMap(() => this.importArticlesPrepaByRefArticle(data).pipe(tap(() => {console.log('--- > importArticlesPrepaByRefArticle')}))),
            mergeMap(() => this.importPreparations(data).pipe(tap(() => {console.log('--- > importPreparations')}))),
            mergeMap(() => this.importLivraisons(data).pipe(tap(() => {console.log('--- > importLivraisons')}))),
            mergeMap(() => this.importArticlesInventaire(data).pipe(tap(() => {console.log('--- > importArticlesInventaire')}))),
            mergeMap(() => this.importHandlings(data).pipe(tap(() => {console.log('--- > importHandlings')}))),
            mergeMap(() => this.importCollectes(data).pipe(tap(() => {console.log('--- > importCollectes')}))),
            mergeMap(() => this.importMouvementTraca(data).pipe(tap(() => {console.log('--- > importMouvementTraca')}))),
            mergeMap(() => this.importDemandesLivraisonData(data).pipe(tap(() => {console.log('--- > importDemandeLivraisonData')}))),
            mergeMap(() => this.importNaturesData(data).pipe(tap(() => {console.log('--- > importNaturesData')}))),
            mergeMap(() => this.importAllowedNaturesData(data).pipe(tap(() => {console.log('--- > importAllowedNaturesData')}))),
            mergeMap(() => this.importFreeFieldsData(data).pipe(tap(() => {console.log('--- > importFreeFieldData')}))),
            mergeMap(() => this.importTranslations(data).pipe(tap(() => {console.log('--- > importTranslations')}))),
            mergeMap(() => this.importDispatchesData(data).pipe(tap(() => {console.log('--- > importDispatchesData')}))),
            mergeMap(() => this.importStatusData(data).pipe(tap(() => {console.log('--- > importStatusData')}))),
            mergeMap(() => this.importTransferOrderData(data).pipe(tap(() => {console.log('--- > importTransferOrderData')}))),
            mergeMap(() => this.importTransportRoundData(data).pipe(tap(() => {console.log('--- > importTransportRoundData')}))),
            mergeMap(() => this.importDispatchTypes(data).pipe(tap(() => {console.log('--- > importDispatchTypesData')}))),
            mergeMap(() => this.importUsers(data).pipe(tap(() => {console.log('--- > importUsersData')}))),
            mergeMap(() => this.importProjects(data).pipe(tap(() => {console.log('--- > importProjects')}))),
            mergeMap(() => (
                this.storageService.getRight(StorageKeyEnum.RIGHT_INVENTORY_MANAGER).pipe(
                    mergeMap((res) => (res
                        ? this.importAnomaliesInventaire(data)
                        : of(undefined))),
                )
            ))
        );
    }

    public findArticlesByCollecte(id_col: number): Observable<Array<ArticleCollecte>> {
        // TODO WIIS-7970
        return this.query(`SELECT * FROM article_collecte WHERE id_collecte = ${id_col}`);
    }

    public findArticlesInDemandeLivraison(demandeId: number) {
        const query = (
            `SELECT demande_livraison_article.*, article_in_demande_livraison.quantity_to_pick AS quantity_to_pick ` +
            `FROM demande_livraison_article ` +
            `INNER JOIN article_in_demande_livraison ON article_in_demande_livraison.article_bar_code = demande_livraison_article.bar_code ` +
            `WHERE article_in_demande_livraison.demande_id = ${demandeId}`
        );
        return this.query(query);
    }

    public findArticlesNotInDemandeLivraison(): Observable<Array<DemandeLivraisonArticle>> {
        const query = (
            `SELECT demande_livraison_article.*
            FROM demande_livraison_article
            LEFT JOIN article_in_demande_livraison ON article_in_demande_livraison.article_bar_code = demande_livraison_article.bar_code
            WHERE article_in_demande_livraison.demande_id IS NULL`
        );
        return this.query(query);
    }

    public countArticlesByDemandeLivraison(demandeIds: Array<number>): Observable<{ [demande_id: number]: number }> {
        const demandeIdsJoined = demandeIds.join(',');
        const query = (
            `SELECT COUNT(article_in_demande_livraison.article_bar_code) AS counter, article_in_demande_livraison.demande_id AS demande_id ` +
            `FROM article_in_demande_livraison ` +
            `WHERE article_in_demande_livraison.demande_id IN (${demandeIdsJoined}) ` +
            `GROUP BY article_in_demande_livraison.demande_id`
        );
        return this.query(query).pipe(
            map((counters: Array<{demande_id: number, counter: number}>) => (
                counters.reduce((acc, {demande_id, counter}) => ({
                    ...acc,
                    [Number(demande_id)]: Number(counter)
                }), {})
            )),
            take(1)
        );
    }

    private createInsertQuery(name: TableName, objects: any|Array<any>): string {
        const isMultiple = Array.isArray(objects);
        const objectKeys = Object.keys(isMultiple ? objects[0] : objects);

        if (!isMultiple) {
            objects = [objects];
        }
        const valuesMap = objects.map((values: any) => (
            '('
            + objectKeys.map((key) => this.getValueForQuery(values[key])).join((', '))
            + ')'
        ));
        return "INSERT INTO " + name +
            ' (' + objectKeys.join(', ') + ') ' +
            "VALUES " +
            valuesMap.join(', ');
    }

    private createUpdateQuery(name: TableName, values: any, where: Array<string>): string|undefined {
        const objectKeys = Object.keys(values);
        const whereClauses = SqliteService.JoinWhereClauses(where);
        const valuesMapped = objectKeys.map((key) => `${key} = ${this.getValueForQuery(values[key])}`);

        return valuesMapped.length > 0
            ? `
                UPDATE ${name}
                SET ${valuesMapped.join(', ')}
                ${where.length > 0 ? 'WHERE ' + whereClauses : ''}
            `
            : undefined;
    }
    public findMvtByArticlePrepa(id_art: number): Observable<any> {
        return this.query('SELECT * FROM `mouvement` WHERE `id_article_prepa` = ' + id_art + ' LIMIT 1').pipe(
            map((mvt) => (
                (mvt && mvt.length > 0 && mvt[0].url !== '')
                    ? mvt[0]
                    : null
            ))
        );
    }

    public findMvtByArticleLivraison(id_art: number): Observable<any> {
        return this.query('SELECT * FROM `mouvement` WHERE `id_article_livraison` = ' + id_art + ' LIMIT 1').pipe(
            map((mvt) => (
                (mvt && mvt.length > 0 && mvt[0].url !== '')
                    ? mvt[0]
                    : null
            ))
        );
    }

    public findMvtByArticleCollecte(id_art: number): Observable<any> {
        return this.query('SELECT * FROM `mouvement` WHERE `id_article_collecte` = ' + id_art + ' LIMIT 1').pipe(
            map((mvt) => (
                (mvt && mvt.length > 0 && mvt[0].url !== '')
                    ? mvt[0]
                    : null
            ))
        );
    }

    public finishPrepa(id_prepa: number, emplacement: string): Observable<undefined> {
        return this.execute('UPDATE `preparation` SET date_end = \'' + moment().format() + '\', emplacement = \'' + emplacement + '\' WHERE id = ' + id_prepa)
            .pipe(map(() => undefined));
    }

    public resetFinishedPrepas(id_prepas: Array<number>): Observable<undefined> {
        const idPrepasJoined = id_prepas.join(',');
        return this.execute(`UPDATE \`preparation\` SET date_end = NULL, emplacement = NULL WHERE id IN (${idPrepasJoined})`)
            .pipe(map(() => undefined));
    }

    public resetFinishedCollectes(id_collectes: Array<number>): Observable<any> {
        const idCollectesJoined = id_collectes.join(',');
        return zip(
            this.execute(`UPDATE \`collecte\` SET date_end = NULL, location_to = NULL WHERE id IN (${idCollectesJoined})`),
            this.execute(`UPDATE \`article_collecte\` SET has_moved = 0 WHERE id_collecte IN (${idCollectesJoined})`)
        ).pipe(map(() => undefined));
    }

    public startPrepa(id_prepa: number): Observable<undefined> {
        return this.execute('UPDATE `preparation` SET started = 1 WHERE id = ' + id_prepa)
            .pipe(map(() => undefined));;
    }

    public finishCollecte(id_collecte: number): Observable<undefined> {
        return this.execute("UPDATE `collecte` SET date_end = '" + moment().format() + '\' WHERE id = ' + id_collecte)
            .pipe(map(() => undefined));
    }

    public finishMvt(id_mvt: number, location_to?: string): Observable<undefined> {
        const setLocationQuery = location_to
            ? `, location = '${location_to}'`
            : '';
        return this.execute(`UPDATE \`mouvement\` SET date_drop = '${moment().format()}'${setLocationQuery} WHERE id = ${id_mvt}`)
            .pipe(map(() => undefined));
    }

    public moveArticle(id_article: number): Observable<undefined> {
        return this.execute('UPDATE `article_prepa` SET has_moved = 1 WHERE id = ' + id_article)
            .pipe(map(() => undefined));;
    }

    public moveArticleLivraison(id_article: number): Observable<undefined> {
        return this.execute('UPDATE `article_livraison` SET has_moved = 1 WHERE id = ' + id_article)
            .pipe(map(() => undefined));;
    }

    public moveArticleCollecte(id_article_collecte: number): Observable<undefined> {
        return this.execute('UPDATE `article_collecte` SET has_moved = 1 WHERE id = ' + id_article_collecte)
            .pipe(map(() => undefined));
    }

    public updateArticlePrepaQuantity(reference: string, idPrepa: number, is_ref: number, quantite: number): Observable<undefined> {
        return this.execute(
            `UPDATE \`article_prepa\` SET quantite = ${quantite} WHERE reference LIKE '${reference}' AND id_prepa = ${idPrepa} AND is_ref LIKE '${is_ref}'`
        ).pipe(map(() => undefined));;
    }

    public updateArticleCollecteQuantity(id_article: number, quantite: number): Observable<undefined> {
        return this.execute('UPDATE `article_collecte` SET quantite = ' + quantite + ' WHERE id = ' + id_article)
            .pipe(map(() => undefined));;
    }

    public deletePreparationsById(preparations: Array<number>): Observable<any> {
        const joinedPreparations = preparations.join(',');
        return preparations.length > 0
            ? zip(
                this.execute(`DELETE FROM \`preparation\` WHERE id IN (${joinedPreparations})`),
                this.execute(`DELETE FROM \`article_prepa\` WHERE id_prepa IN (${joinedPreparations})`)
            ).pipe(map(() => undefined))
            : of(undefined);
    }

    public resetArticlePrepaByPrepa(ids: Array<number>): Observable<any> {
        const idsJoined = ids.join(',');
        return ids.length > 0
            ? zip(
                this.execute( `UPDATE \`article_prepa\` SET deleted = 0, has_moved = 0, quantite = original_quantity WHERE id_prepa IN (${idsJoined}) ;`),
                this.execute( `DELETE FROM \`article_prepa\` WHERE id_prepa IN (${idsJoined}) AND isSelectableByUser = 1;`)
            ).pipe(map(() => undefined))
            : of(undefined);
    }

    public deleteArticlePrepa(reference: string, id_prepa: string, is_ref: number): Observable<void> {
        return this.execute(`UPDATE \`article_prepa\` SET deleted = 1 WHERE reference = '${reference}' AND id_prepa = ${id_prepa} AND is_ref = ${is_ref}`)
            .pipe(map(() => undefined));
    }

    private getValueForQuery(value: any): string {
        return (
            (typeof value === 'string') ? `'${this.escapeQuotes(value)}'` :
                (typeof value === 'boolean') ? `${Number(value)}` :
                    ((value === null) || (value === undefined)) ? 'null' :
                        (Array.isArray(value) || typeof value === 'object') ? `'${this.escapeQuotes(JSON.stringify(value))}'` :
                            `${value}`
        );
    }

    private getComparatorForQuery(value: any): string {
        return (typeof value === 'string') ? 'LIKE' : '=';
    }

    public deleteLivraionsById(livraisons: Array<number>): Observable<any> {
        const joinedLivraisons = livraisons.join(',');
        return livraisons.length > 0
            ? zip(
                this.execute(`DELETE FROM \`livraison\` WHERE id IN (${joinedLivraisons});`),
                this.execute(`DELETE FROM \`article_livraison\` WHERE id_livraison IN (${joinedLivraisons})`)
            ).pipe(map(() => undefined))
            : of(undefined);
    }

    public deleteMouvementsBy(columnName: 'id_prepa'|'id_livraison'|'id_collecte', ids: Array<number>): Observable<any> {
        const idsJoined = ids.join(',');
        return ids.length > 0
            ? this.execute(`DELETE FROM \`mouvement\` WHERE ${columnName} IN (${idsJoined})`).pipe(map(() => undefined))
            : of(undefined);
    }

    public deleteCollecteById(collecteIds: Array<number>): Observable<any> {
        const joinedCollecte = collecteIds.join(',');
        return collecteIds.length > 0
            ? zip(
                this.execute(`DELETE FROM \`collecte\` WHERE id IN (${joinedCollecte});`),
                this.execute(`DELETE FROM \`article_collecte\` WHERE id_collecte IN (${joinedCollecte})`)
            )
            : of(undefined);
    }

    public finishPrises(ids: Array<number>): Observable<any> {
        return ids.length > 0
            ? this.execute(`UPDATE \`mouvement_traca\` SET finished = 1 WHERE id IN (${ids.join(',')})`).pipe(map(() => undefined))
            : of(undefined);
    }

    private escapeQuotes(str: string): string {
        return (typeof str === 'string')
            ? str.replace(/'/g, "''")
            : str;
    }

    public resetMouvementsTraca(refArticles: Array<string>, type: string, fromStock: boolean): Observable<any> {
        return refArticles.length > 0
            ? this.execute(
                'UPDATE mouvement_traca ' +
                'SET finished = 0 ' +
                `WHERE type LIKE '${type}' ` +
                `  AND fromStock = ${Number(fromStock)} ` +
                `  AND ref_article IN (${refArticles.map((ref) => `'${this.escapeQuotes(ref)}'`).join(',')})`
            )
            : of(undefined);
    }

    public getPrises(fromStock: boolean): Observable<Array<MouvementTraca>> {
        return this
            .query(`
                SELECT *
                FROM mouvement_traca mouvement_traca
                WHERE id IN (
                    SELECT mouvement_traca_2.id
                    FROM mouvement_traca mouvement_traca_2
                    WHERE mouvement_traca_2.ref_article = mouvement_traca.ref_article
                      AND mouvement_traca_2.fromStock = ${Number(fromStock)}
                    ORDER BY mouvement_traca_2.id DESC
                    LIMIT 1
                )
                AND mouvement_traca.type = 'prise'
            `);
    }
}
