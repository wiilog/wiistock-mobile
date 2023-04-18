import {Component, EventEmitter, ViewChild} from '@angular/core';
import {SelectItemComponent} from '@common/components/select-item/select-item.component';
import {Emplacement} from '@entities/emplacement';
import {Livraison} from '@entities/livraison';
import {SelectItemTypeEnum} from '@common/components/select-item/select-item-type.enum';
import {BarcodeScannerModeEnum} from '@common/components/barcode-scanner/barcode-scanner-mode.enum';
import {IconConfig} from '@common/components/panel/model/icon-config';
import {ToastService} from '@app/services/toast.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {NavService} from '@app/services/nav/nav.service';
import {from, of, zip} from 'rxjs';
import {mergeMap, map} from 'rxjs/operators';
import * as moment from 'moment';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {StorageService} from '@app/services/storage/storage.service';
import {LoadingService} from "@app/services/loading.service";
import {NetworkService} from '@app/services/network.service';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";

@Component({
    selector: 'wii-livraison-emplacement',
    templateUrl: './livraison-emplacement.page.html',
    styleUrls: ['./livraison-emplacement.page.scss'],
})
export class LivraisonEmplacementPage implements ViewWillEnter, ViewWillLeave{
    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public readonly selectItemType = SelectItemTypeEnum.LOCATION;

    public location: Emplacement;
    public livraison: Livraison;

    public barcodeScannerSearchMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.TOOL_SEARCH;

    public panelHeaderConfig: {
        title: string;
        subtitle?: string;
        leftIcon: IconConfig;
        transparent: boolean;
    };

    public resetEmitter$: EventEmitter<void>;

    public dropOnFreeLocation: boolean;
    private validateIsLoading: boolean;
    private validateLivraison: () => void;

    public skipValidation: boolean = false;

    public constructor(private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private networkService: NetworkService,
                       private localDataManager: LocalDataManagerService,
                       private loadingService: LoadingService,
                       private storageService: StorageService,
                       private navService: NavService) {
        this.validateIsLoading = false;
        this.resetEmitter$ = new EventEmitter<void>();
    }

    public ionViewWillEnter(): void {
        this.storageService.getRight(StorageKeyEnum.PARAMETER_SKIP_VALIDATION_DELIVERY).subscribe((skipValidation) => {
            this.skipValidation = skipValidation;
            this.validateLivraison = this.navService.param('validateLivraison');
            this.livraison = this.navService.param('livraison');
            this.storageService.getRight(StorageKeyEnum.PARAMETER_DELIVERY_REQUEST_ALLOWED_DROP_ON_FREE_LOCATION).subscribe((dropOnFreeLocation: boolean) => {
                this.dropOnFreeLocation = dropOnFreeLocation;
            });

            this.resetEmitter$.emit();

            this.panelHeaderConfig = this.createPanelHeaderConfig();

            if (this.selectItemComponent) {
                this.selectItemComponent.fireZebraScan();
            }
        });
    }

    public ionViewWillLeave(): void {
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
    }

    public selectLocation(locationToTest: Emplacement): void {
        if (this.dropOnFreeLocation || this.livraison.location === locationToTest.label) {
            this.location = locationToTest;
            this.panelHeaderConfig = this.createPanelHeaderConfig();
            if (this.skipValidation) {
                this.validate();
            }
        }
        else {
            this.toastService.presentToast("Vous n'avez pas scanné le bon emplacement (destination demandée : " + this.livraison.location + ")")
        }
    }

    public validate(): void {
        if (!this.validateIsLoading) {
            if (this.location && this.location.label) {
                this.loadingService.presentLoadingWhile(
                    {
                        message: 'Envoi de la livraison en cours...',
                        event: () => {
                            this.validateIsLoading = true;
                            return this.sqliteService
                                .findBy('article_livraison', [`id_livraison = ${this.livraison.id}`])
                                .pipe(
                                    mergeMap((articles) => zip(
                                        ...articles.map((article) => (
                                            this.sqliteService
                                                .findMvtByArticleLivraison(article.id)
                                                .pipe(mergeMap((mvt) => this.sqliteService.finishMvt(mvt.id, this.location.label)))
                                        ))
                                    )),
                                    mergeMap(() => this.sqliteService.update(
                                        'livraison',
                                        [{
                                            values: {
                                                date_end: moment().format(),
                                                location: this.location.label
                                            },
                                            where: [`id = ${this.livraison.id}`]
                                        }]
                                    )),
                                    mergeMap(() => from(this.networkService.hasNetwork())),
                                    mergeMap((hasNetwork): any => (
                                        hasNetwork
                                            ? this.localDataManager.sendFinishedProcess('livraison')
                                            : of({offline: true})
                                    )),
                                    mergeMap((res: any) => (
                                        res.offline || res.success.length > 0
                                            ? this.storageService.incrementCounter(StorageKeyEnum.COUNTERS_DELIVERIES_TREATED).pipe(map(() => res))
                                            : of(res)
                                    )),
                                );
                        }
                    }
                ).subscribe(
                    ({offline, success}: any) => {
                        if (offline) {
                            this.toastService.presentToast('Livraison sauvegardée localement, nous l\'enverrons au serveur une fois internet retrouvé');
                            this.closeScreen();
                        } else {
                            this.handleLivraisonSuccess(success.length);
                        }
                    },
                    (error) => {
                        this.handleLivraisonError(error);
                    });
            }
            else {
                this.toastService.presentToast('Veuillez sélectionner ou scanner un emplacement.');
            }
        }
        else {
            this.toastService.presentToast('Chargement en cours...');
        }
    }

    private handleLivraisonSuccess(nbLivraisonsSucceed: number): void {
        if (nbLivraisonsSucceed > 0) {
            this.toastService.presentToast(
                (nbLivraisonsSucceed === 1
                    ? 'Votre livraison a bien été enregistrée'
                    : `Votre livraison et ${nbLivraisonsSucceed - 1} livraison${nbLivraisonsSucceed - 1 > 1 ? 's' : ''} en attente ont bien été enregistrées`)
            );
        }
        this.closeScreen();
    }

    private handleLivraisonError(resp: any): void {
        this.validateIsLoading = false;
        this.toastService.presentToast((resp && resp.api && resp.message) ? resp.message : 'Une erreur s\'est produite');
        if (resp.api) {
            throw resp;
        }
    }

    private closeScreen(): void {
        this.validateIsLoading = false;
        this.navService.pop().subscribe(() => {
            this.validateLivraison();
        });
    }

    private createPanelHeaderConfig(): { title: string; subtitle?: string; leftIcon: IconConfig; transparent: boolean;} {
        return {
            title: 'Emplacement sélectionné',
            subtitle: this.location && this.location.label,
            transparent: true,
            leftIcon: {
                name: 'delivery.svg'
            }
        };
    }
}
