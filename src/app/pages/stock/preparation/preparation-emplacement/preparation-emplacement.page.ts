import {Component, EventEmitter, ViewChild} from '@angular/core';
import {NavService} from '@app/services/nav/nav.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {ToastService} from '@app/services/toast.service';
import {StorageService} from '@app/services/storage/storage.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {BarcodeScannerModeEnum} from '@common/components/barcode-scanner/barcode-scanner-mode.enum';
import {IconConfig} from '@common/components/panel/model/icon-config';
import {Preparation} from '@entities/preparation';
import {Emplacement} from '@entities/emplacement';
import {SelectItemTypeEnum} from '@common/components/select-item/select-item-type.enum';
import {SelectItemComponent} from '@common/components/select-item/select-item.component';
import {mergeMap, map} from 'rxjs/operators';
import {from, of, Subscription, zip} from 'rxjs';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {NetworkService} from '@app/services/network.service';
import {LoadingService} from '@app/services/loading.service';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";


@Component({
    selector: 'wii-preparation-emplacement',
    templateUrl: './preparation-emplacement.page.html',
    styleUrls: ['./preparation-emplacement.page.scss'],
})
export class PreparationEmplacementPage implements ViewWillEnter, ViewWillLeave {
    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.TOOL_SEARCH;
    public readonly selectItemType = SelectItemTypeEnum.LOCATION;

    public location: Emplacement;
    public preparation: Preparation;

    public panelHeaderConfig: {
        title: string;
        subtitle?: string;
        leftIcon: IconConfig;
        transparent: boolean;
    };

    public resetEmitter$: EventEmitter<void>;

    public skipValidation: boolean;

    private validateSubscription?: Subscription;

    private validatePrepa: () => void;

    public constructor(private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       private networkService: NetworkService,
                       private loadingService: LoadingService,
                       private localDataManager: LocalDataManagerService,
                       private navService: NavService) {
        this.skipValidation = false;
        this.resetEmitter$ = new EventEmitter<void>();
    }

    public ionViewWillEnter(): void {
        this.preparation = this.navService.param('preparation');
        this.validatePrepa = this.navService.param('validatePrepa');

        this.storageService
            .getRight(StorageKeyEnum.PARAMETER_SKIP_VALIDATION_PREPARATIONS)
            .subscribe((skipValidation) => {
                this.skipValidation = skipValidation;
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

    public selectLocation(location: Emplacement): void {
        this.location = location;
        this.panelHeaderConfig = this.createPanelHeaderConfig();
        if (this.skipValidation) {
            this.validate();
        }
    }

    public validate(): void {
        if (!this.validateSubscription) {
            if (this.location && this.location.label) {
                this.validateSubscription = this.loadingService
                    .presentLoadingWhile({
                        event: () => (
                            this.sqliteService
                                .findBy('article_prepa', [`id_prepa = ${this.preparation.id}`, `deleted <> 1`])
                                .pipe(
                                    mergeMap((articles) => zip(
                                        ...articles.map((article) => (
                                            this.sqliteService
                                                .findMvtByArticlePrepa(article.id)
                                                .pipe(
                                                    mergeMap((mvt) => (
                                                        mvt
                                                            ? this.sqliteService.finishMvt(mvt.id, this.location.label)
                                                            : of(undefined)
                                                    ))
                                                )
                                        ))
                                    )),

                                    mergeMap(() => this.sqliteService.finishPrepa(this.preparation.id, this.location.label)),
                                    mergeMap(() => from(this.networkService.hasNetwork())),
                                    mergeMap((hasNetwork): any => (
                                        hasNetwork
                                            ? this.localDataManager.sendFinishedProcess('preparation')
                                            : of({offline: true})
                                    )),
                                    mergeMap((res: any) => (
                                        res.offline || res.success.length > 0
                                            ? this.storageService.incrementCounter(StorageKeyEnum.COUNTERS_PREPARATIONS_TREATED).pipe(map(() => res))
                                            : of(res)
                                    )),
                                )
                        )
                    })
                    .subscribe(
                        ({offline, success}: any) => {
                            if (offline) {
                                this.toastService.presentToast('Préparation sauvegardée localement, nous l\'enverrons au serveur une fois internet retrouvé');
                                this.closeScreen();
                            }
                            else {
                                this.handlePreparationsSuccess(success.length);
                            }
                        },
                        (error) => {
                            this.handlePreparationsError(error);
                            this.unsubscribeValidate();
                        });
            }
            else {
                this.toastService.presentToast('Veuillez sélectionner ou scanner un emplacement.');
            }
        }
    }

    private handlePreparationsSuccess(nbPreparationsSucceed: number): void {
        if (nbPreparationsSucceed > 0) {
            this.toastService.presentToast(
                (nbPreparationsSucceed === 1
                    ? 'Votre préparation a bien été enregistrée'
                    : `Votre préparation et ${nbPreparationsSucceed - 1} préparation${nbPreparationsSucceed - 1 > 1 ? 's' : ''} en attente ont bien été enregistrées`)
            );
        }
        this.closeScreen();
    }

    private handlePreparationsError(resp: any): void {
        this.toastService.presentToast((resp && resp.api && resp.message) ? resp.message : 'Une erreur s\'est produite');
        throw resp;
    }

    private closeScreen(): void {
        this.unsubscribeValidate();
        this.navService.pop().subscribe(() => {
            this.validatePrepa();
        });
    }

    private createPanelHeaderConfig(): { title: string; subtitle?: string; leftIcon: IconConfig; transparent: boolean;} {
        return {
            title: 'Emplacement sélectionné',
            subtitle: this.location && this.location.label,
            transparent: true,
            leftIcon: {
                name: 'preparation.svg'
            }
        };
    }

    private unsubscribeValidate(): void {
        if (this.validateSubscription && !this.validateSubscription.closed) {
            this.validateSubscription.unsubscribe();
        }
        this.validateSubscription = undefined;
    }
}
