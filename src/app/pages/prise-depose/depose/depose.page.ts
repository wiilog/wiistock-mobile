import {Component, ViewChild} from '@angular/core';
import {BarcodeScannerComponent} from '@common/components/barcode-scanner/barcode-scanner.component';
import {Emplacement} from '@entities/emplacement';
import {MouvementTraca} from '@entities/mouvement-traca';
import {HeaderConfig} from '@common/components/panel/model/header-config';
import {ListPanelItemConfig} from '@common/components/panel/model/list-panel/list-panel-item-config';
import {BarcodeScannerModeEnum} from '@common/components/barcode-scanner/barcode-scanner-mode.enum';
import {Observable, of, Subscription, zip} from 'rxjs';
import {ToastService} from '@app/services/toast.service';
import {LoadingService} from '@app/services/loading.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {TrackingListFactoryService} from '@app/services/tracking-list-factory.service';
import {StorageService} from '@app/services/storage/storage.service';
import {NavService} from '@app/services/nav/nav.service';
import {map, mergeMap, tap} from 'rxjs/operators';
import * as moment from 'moment';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {MovementConfirmType} from '@pages/prise-depose/movement-confirm/movement-confirm-type';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {ApiService} from '@app/services/api.service';
import {TranslationService} from '@app/services/translations.service';
import {Nature} from '@entities/nature';
import {Translations} from '@entities/translation';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {AlertService} from '@app/services/alert.service';
import {NetworkService} from '@app/services/network.service';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";
import {HttpErrorResponse} from "@angular/common/http";

@Component({
    selector: 'wii-depose',
    templateUrl: './depose.page.html',
    styleUrls: ['./depose.page.scss'],
})
export class DeposePage implements ViewWillEnter, ViewWillLeave, CanLeave {

    static readonly MOUVEMENT_TRACA_DEPOSE = 'depose';

    public readonly listIdentifierName;

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public emplacement: Emplacement;
    public colisPrise: Array<MouvementTraca&{hidden?: boolean; subPacks: any; trackingDelayData?: Array<string>;}>;
    public colisDepose: Array<MouvementTraca&{subPacks?: any; trackingDelayData?: Array<string>;}>;

    public priseListConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };

    public deposeListConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };

    public listBoldValues: Array<string>;

    public readonly scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.ONLY_MANUAL;

    public loading: boolean;

    public fromStock: boolean;
    private createTakeAndDrop: boolean = false;

    private saveSubscription?: Subscription;

    private finishAction: () => void;

    private operator: string;

    private skipValidation: boolean;

    private natureTranslations: Translations;
    private allowedNatureIdsForLocation: Array<number>;

    private natureIdsToConfig: {[id: number]: { label: string; color?: string; }};

    public constructor(private networkService: NetworkService,
                       private alertService: AlertService,
                       private apiService: ApiService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private sqliteService: SqliteService,
                       private localDataManager: LocalDataManagerService,
                       private trackingListFactory: TrackingListFactoryService,
                       private storageService: StorageService,
                       private translationService: TranslationService,
                       private navService: NavService) {
        this.listIdentifierName = TrackingListFactoryService.TRACKING_IDENTIFIER_NAME;
        this.init();
        this.listBoldValues = [
            'object',
            'quantity',
            'articlesCount',
            'date',
            'nature',
            'trackingDelay',
            'limitTreatmentDate',
        ];
    }

    public ionViewWillEnter(): void {
        this.trackingListFactory.enableActions();
        this.createTakeAndDrop = this.navService.param('createTakeAndDrop');
        if (!this.operator) {
            this.init();
            this.emplacement = this.navService.param('emplacement');
            this.finishAction = this.navService.param('finishAction');
            this.fromStock = Boolean(this.navService.param('fromStock'));
            this.initData();
        }
        else {
            this.footerScannerComponent.fireZebraScan();
        }
    }


    public ionViewWillLeave(): void {
        this.trackingListFactory.disableActions();
        this.footerScannerComponent.unsubscribeZebraScan();
        this.unsubscribeSaveSubscription();
    }

    public wiiCanLeave(): boolean {
        return !this.trackingListFactory.alertPresented;
    }

    public async finishTaking() {
        if (this.colisDepose && this.colisDepose.length > 0) {
            if(!this.saveSubscription) {
                const multiDepose = (this.colisDepose.length > 1);
                const online = await this.networkService.hasNetwork();

                if (!this.fromStock || online) {
                    const takingToFinish = this.navService.param('articlesList') ? [] : this.colisPrise
                        .filter(({hidden}) => hidden)
                        .map(({id}) => id)
                        .filter((id) => id) as Array<number>;

                    const groupingMovements = this.colisDepose.filter(({isGroup, subPacks}) => isGroup && (!subPacks || subPacks.length > 0));
                    if (!this.fromStock
                        && !online
                        && groupingMovements.length > 0) {
                        this.toastService.presentToast('Votre dépose contient des groupes, veuillez vous connecter à internet pour continuer.');
                        return;
                    }

                    this.saveSubscription = this.loadingService
                        .presentLoadingWhile({
                            message: multiDepose ? 'Envoi des déposes en cours...' : 'Envoi de la dépose en cours...',
                            event: () => {
                                return this.localDataManager
                                    .saveTrackingMovements(this.colisDepose, takingToFinish)
                                    .pipe(
                                        mergeMap(async () => await this.networkService.hasNetwork()),
                                        mergeMap((hasNetwork): Observable<{ hasNetwork: boolean; apiResponse?: { [x: string]: any } }> => (
                                            hasNetwork
                                                ? this.localDataManager
                                                    .sendMouvementTraca(this.fromStock, this.createTakeAndDrop)
                                                    .pipe(
                                                        mergeMap((apiResponse) => (
                                                            !this.fromStock && groupingMovements.length > 0
                                                                ? this.postGroupingMovements(groupingMovements, apiResponse)
                                                                : of(apiResponse)
                                                        )),
                                                        map((apiResponse) => ({hasNetwork, apiResponse}))
                                                    )
                                                : of({hasNetwork})
                                        )),
                                        mergeMap((a) => this.treatApiResponse(a.hasNetwork, a.apiResponse, multiDepose)),
                                    )
                            }
                        })
                        .subscribe({
                            next: (nbErrors: number) => {
                                this.unsubscribeSaveSubscription();
                                this.redirectAfterTake(nbErrors > 0);
                            },
                            error: (error) => {
                                this.unsubscribeSaveSubscription();
                                if(error instanceof HttpErrorResponse && error.status == 0) {
                                    this.toastService.presentToast(`Une erreur réseau est survenue.`)
                                    this.redirectAfterTake();
                                } else {
                                    throw error;
                                }
                            }
                        });
                }
            }
            else {
                this.toastService.presentToast('Vous devez être connecté à internet pour effectuer la dépose.');
            }
        }
        else {
            this.toastService.presentToast(`Vous devez sélectionner au moins un ${this.objectLabel}`);
        }
    }

    public redirectAfterTake(hasErrors: boolean = false): void {
        if (!hasErrors) {
            const articlesList = this.navService.param('articlesList');
            this.navService.pop()
                .pipe(
                    mergeMap(() => articlesList
                        ? this.navService.pop()
                        : of (undefined))
                )
                .subscribe(() => {
                    if(articlesList){
                        this.navService.push(NavPathEnum.LIVRAISON_ARTICLES, {
                            livraison: this.navService.param('livraisonToRedirect')
                        });
                    } else {
                        this.finishAction();
                    }
                });
        } else {
            this.init();
            this.initData();
        }
    }

    public testColisDepose(barCode: string|undefined, isManualInput: boolean = false): void {
        const pickingIndexes = this.findPickingIndexes(barCode);
        if (pickingIndexes.length > 0) {
            this.saveMouvementTraca(pickingIndexes);
        }
        else {
            this.toastService.presentToast(`Cet ${this.objectLabel} ne correspond à aucune prise`, {audio: true});
        }
    }

    public get objectLabel(): string {
        return `objet`;
    }

    public get displayPrisesList(): boolean {
        return (
            this.colisPrise
            && this.colisPrise.filter(({hidden, packGroup}) => !hidden && !packGroup).length > 0
        );
    }

    private saveMouvementTraca(pickingIndexes: Array<number>): void {
        if (pickingIndexes.length > 0) {
            const pickedNatures: Array<number> = pickingIndexes.reduce((acc: Array<number>, pickingIndex) => {
                const natureId = this.colisPrise[pickingIndex].nature_id as number;
                if (acc.indexOf(natureId) === -1) {
                    acc.push(natureId);
                }
                return acc;
            }, []);

            const allowedMovement = (
                this.fromStock
                || this.allowedNatureIdsForLocation.length === 0
                || pickedNatures.every((pickedNatureId) => (this.allowedNatureIdsForLocation.some((nature_id) => (nature_id === pickedNatureId))))
            );
            if (allowedMovement) {
                for (const pickingIndex of pickingIndexes) {
                    const picking = this.colisPrise[pickingIndex];
                    if (!picking.packGroup || this.findDropIndexes(picking.packGroup).length === 0) {
                        let quantity = picking.quantity;
                        picking.hidden = true;

                        this.colisDepose.unshift({
                            articles: picking.articles,
                            ref_article: picking.ref_article,
                            nature_id: picking.nature_id,
                            comment: picking.comment,
                            signature: picking.signature,
                            fromStock: Number(this.fromStock),
                            quantity,
                            subPacks: picking.subPacks,
                            isGroup: picking.isGroup,
                            type: DeposePage.MOUVEMENT_TRACA_DEPOSE,
                            operateur: this.operator as string,
                            photo: picking.photo,
                            ref_emplacement: this.emplacement.label,
                            date: moment().format(),
                            freeFields: picking.freeFields,
                            packGroup: picking.packGroup,
                            containsArticle: picking.containsArticle
                        });

                        const remover = TrackingListFactoryService.CreateRemoveItemFromListHandler(
                            this.colisDepose,
                            this.colisPrise,
                            () => {
                                this.refreshPriseListComponent();
                                this.refreshDeposeListComponent();
                            }
                        );

                        for (const subPack of (picking.subPacks || [])) {
                            let dropIndexes = this.findDropIndexes(subPack.code);
                            while (dropIndexes.length > 0) {
                                remover({object: {value: subPack.code}});
                                dropIndexes = this.findDropIndexes(subPack.code);
                            }
                        }

                        this.refreshPriseListComponent();
                        this.refreshDeposeListComponent();
                        this.footerScannerComponent.fireZebraScan();
                    }
                    else {
                        this.toastService.presentToast(`Cet objet est déjà dans le groupe <b>${picking.packGroup}</b>`);
                        break;
                    }
                }
                if (this.pickingIsOver() && this.skipValidation) {
                    this.finishTaking();
                }
            }
            else {
                const natureLabel = TranslationService.Translate(this.natureTranslations, 'Nature').toLowerCase();
                const {ref_article, nature_id} = this.colisPrise[pickingIndexes[0]] || {};
                const nature = nature_id ? this.natureIdsToConfig[nature_id] : undefined;
                const natureValue = (nature ? nature.label : 'non défini');
                this.alertService.show({
                    header: 'Erreur',
                    cssClass: AlertService.CSS_CLASS_MANAGED_ALERT,
                    message: `Le colis <strong>${ref_article}</strong>`
                        + ` de ${natureLabel} <strong>${natureValue}</strong>`
                        + ` ne peut pas être déposé sur l'emplacement <strong>${this.emplacement.label}</strong>.`,
                    buttons: [{
                        text: 'Confirmer',
                        cssClass: 'alert-danger'
                    }]
                });
            }
        }
    }

    private pickingIsOver(): boolean {
        return this.colisPrise.filter(({hidden, packGroup}) => (!hidden && !packGroup)).length === 0;
    }

    private updatePicking(barCode: string|undefined,
                          {quantity, comment, signature, photo, natureId, freeFields, isGroup, subPacks}: {quantity: number; comment?: string; signature?: string; photo?: string; natureId: number; freeFields: string; isGroup: number; subPacks: any;}): void {
        const dropIndexes = this.findDropIndexes(barCode);

        if (dropIndexes.length > 0) {
            for(const dropIndex of dropIndexes) {
                if (quantity > 0) {
                    this.colisDepose[dropIndex].quantity = quantity;
                }
                this.colisDepose[dropIndex].comment = comment;
                this.colisDepose[dropIndex].signature = signature;
                this.colisDepose[dropIndex].photo = photo;
                this.colisDepose[dropIndex].nature_id = natureId;
                this.colisDepose[dropIndex].freeFields = freeFields;
                this.colisDepose[dropIndex].isGroup = isGroup;
                this.colisDepose[dropIndex].subPacks = subPacks;
            }

            this.refreshPriseListComponent();
            this.refreshDeposeListComponent();
        }

        this.footerScannerComponent.fireZebraScan();
    }

    private refreshPriseListComponent(): void {
        const natureLabel = TranslationService.Translate(this.natureTranslations, 'Nature');
        this.priseListConfig = this.trackingListFactory.createListConfig(
            this.colisPrise.filter(({hidden, packGroup}) => (!hidden && !packGroup)),
            TrackingListFactoryService.LIST_TYPE_DROP_SUB,
            {
                headerRightIcon: [
                    {
                        color: 'primary',
                        name: 'scan-photo.svg',
                        action: () => {
                            this.footerScannerComponent.scan();
                        }
                    },
                    {
                        name: 'up.svg',
                        action: () => {
                            this.dropAll()
                        },
                    }
                ],
                objectLabel: this.objectLabel,
                rightIcon: {
                    mode: 'upload',
                    action: ({object}) => {
                        this.testColisDepose(object.value, true);
                    }
                },
                natureIdsToConfig: this.natureIdsToConfig,
                natureTranslation: natureLabel
            }
        );
    }

    private dropAll() {
        this.colisPrise
            .filter(({hidden}) => !hidden)
            .forEach(({ref_article}) => {
                this.testColisDepose(ref_article, true)
            });
    }

    private refreshDeposeListComponent(): void {
        const natureLabel = TranslationService.Translate(this.natureTranslations, 'Nature');
        this.deposeListConfig = this.trackingListFactory.createListConfig(
            this.colisDepose,
            TrackingListFactoryService.LIST_TYPE_DROP_MAIN,
            {
                natureIdsToConfig: this.natureIdsToConfig,
                natureTranslation: natureLabel,
                objectLabel: this.objectLabel,
                location: this.emplacement,
                confirmItem: !this.fromStock
                    ? (element: { object?: { value?: string } }) => {
                        const {object} = element || {};
                        const {value: barCode} = object || {};
                        // we get first
                        const [dropIndex] = this.findDropIndexes(barCode);
                        if (dropIndex !== undefined) {
                            const {quantity, comment, signature, photo, nature_id: natureId, freeFields, isGroup, subPacks} = this.colisDepose[dropIndex];
                            this.trackingListFactory.disableActions();
                            this.navService.push(NavPathEnum.MOVEMENT_CONFIRM, {
                                fromStock: this.fromStock,
                                location: this.emplacement,
                                barCode,
                                isGroup,
                                subPacks,
                                values: {
                                    quantity,
                                    comment,
                                    signature,
                                    natureId,
                                    photo,
                                    freeFields
                                },
                                validate: (values: any) => {
                                    this.updatePicking(barCode, values);
                                },
                                movementType: MovementConfirmType.DROP,
                            });
                        }
                    }
                    : undefined,
                rightIcon: {
                    mode: 'remove',
                    action: TrackingListFactoryService.CreateRemoveItemFromListHandler(
                        this.colisDepose,
                        this.colisPrise,
                        () => {
                            this.refreshPriseListComponent();
                            this.refreshDeposeListComponent();
                        }
                    )
                }
            }
        );
    }

    public initData() {
        zip(
            this.sqliteService.findBy(
                'mouvement_traca',
                [
                    `type LIKE 'prise'`,
                    `finished = 0`,
                    `fromStock = ${Number(this.fromStock)}`
                ]
            ),
            this.storageService.getString(StorageKeyEnum.OPERATOR) as Observable<string>,
            this.storageService.getRight(StorageKeyEnum.PARAMETER_SKIP_VALIDATION_MANUAL_TRANSFER),
            this.sqliteService.findAll('nature'),
            this.sqliteService.findBy('allowed_nature_location', ['location_id = ' + this.emplacement.id]),
            this.translationService.get(null, `Traçabilité`, `Général`)
        )
            .subscribe(([colisPrise, operator, skipValidation, natures, allowedNatureLocationArray, natureTranslations]) => {
                this.colisPrise = this.navService.param('articlesList') || colisPrise.map(({subPacks, ...tracking}) => ({
                    ...tracking,
                    subPacks: subPacks ? JSON.parse(subPacks) : []
                }));

                this.operator = operator;
                this.skipValidation = skipValidation && this.fromStock;
                this.natureTranslations = natureTranslations;
                this.natureIdsToConfig = natures.reduce((acc, {id, color, label}: Nature) => ({
                    [id]: {label, color},
                    ...acc
                }), {});

                this.allowedNatureIdsForLocation = allowedNatureLocationArray.map(({nature_id}) => nature_id);
                this.footerScannerComponent.fireZebraScan();

                this.refreshDeposeListComponent();
                this.refreshPriseListComponent();
                this.loading = false;
            });
    }

    private init(): void {
        this.loading = true;
        this.colisDepose = [];
        this.colisPrise = [];
    }

    private findPickingIndexes(barCode: string|undefined): Array<number> {
        return this.colisPrise.reduce(
            (acc: Array<number>, {ref_article, hidden}, currentIndex) => {
                if (ref_article === barCode
                    && !hidden) {
                    acc.push(currentIndex);
                }
                return acc;
            },
            []
        );
    }

    private findDropIndexes(barCode: string|undefined): Array<number> {
        return this.colisDepose.reduce(
            (acc: Array<number>, {ref_article}, currentIndex) => {
                if (ref_article === barCode) {
                    acc.push(currentIndex);
                }
                return acc;
            },
            []
        );
    }

    private treatApiResponse(online: any, apiResponse: any, multiDepose: any) {
        const emptyGroups = ((apiResponse && apiResponse.data && apiResponse.data.emptyGroups) || null)
        const errorsObject = ((apiResponse && apiResponse.data && apiResponse.data.errors) || {});
        const errorsValues = Object.keys(errorsObject).map((key) => errorsObject[key]);
        const errorsMessage = errorsValues.join('\n');
        const message = online
            ? (errorsMessage.length > 0 ? '' : apiResponse.data.status)
            : (multiDepose
                ? 'Déposes sauvegardées localement, nous les enverrons au serveur une fois internet retrouvé'
                : 'Dépose sauvegardée localement, nous l\'enverrons au serveur une fois internet retrouvé');
        return this.toastService
            .presentToast(`${errorsMessage}${(errorsMessage && message) ? '\n' : ''}${message}`, { duration: ToastService.LONG_DURATION })
            .pipe(
                mergeMap(() => {
                    const groupPlural = (emptyGroups && emptyGroups.length > 0);
                    return (emptyGroups && emptyGroups.length > 0)
                        ? zip(
                            this.toastService.presentToast(
                                groupPlural
                                    ? `${emptyGroups.join(', ')} vides. Ces groupes ne sont plus en prise.`
                                    : `${emptyGroups.join(', ')} vide. Ce groupe n'est plus en prise.`
                            ),
                            this.sqliteService
                                .deleteBy('mouvement_traca', [
                                    emptyGroups
                                        .map((code: any) => `ref_article LIKE '${code}'`)
                                        .join(' OR ')
                                ])
                        )
                        : of(undefined)
                }),
                map(() => errorsValues.length)
            );
    }

    private postGroupingMovements(groupingMovements: any, apiResponse: any) {
        return this.apiService.requestApi(ApiService.POST_GROUP_TRACKINGS, {
            pathParams: {mode: 'drop'},
            params: this.localDataManager.extractTrackingMovementFiles(this.localDataManager.mapTrackingMovements(groupingMovements))
        })
            .pipe(
                mergeMap((res) => {
                    if (res.finishedMovements && res.finishedMovements.length > 0) {
                        return this.sqliteService
                            .deleteBy('mouvement_traca', [
                                `ref_article IN (${res.finishedMovements.map((ref_article: any) => `'${ref_article}'`).join(',')})`
                            ])
                            .pipe(
                                tap(() => {
                                    const movementCounter = (apiResponse && apiResponse.data && apiResponse.data.movementCounter) || 0;
                                    const insertedMovements = movementCounter + res.finishedMovements.length;
                                    const messagePlural = insertedMovements > 1 ? 's' : '';

                                    apiResponse.data = {
                                        ...(apiResponse.data || {}),
                                        status: `${insertedMovements} mouvement${messagePlural} synchronisé${messagePlural}`
                                    };
                                })
                            )
                    }
                    else {
                        return of(res);
                    }
                }),
                tap((res) => {
                    if (res && !res.success) {
                        this.toastService.presentToast(res.message || 'Une erreur inconnue est survenue');
                        throw new Error(res.message);
                    }
                }),
                map(() => apiResponse)
            )
    }

    private unsubscribeSaveSubscription() {
        if (this.saveSubscription && !this.saveSubscription.closed) {
            this.saveSubscription.unsubscribe();
            this.saveSubscription = undefined;
        }
    }
}
