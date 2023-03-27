import {Component, ViewChild} from '@angular/core';
import {of, Subscription, zip} from 'rxjs';
import {NavService} from '@app/services/nav/nav.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {LoadingService} from '@app/services/loading.service';
import {filter, mergeMap, map, tap} from 'rxjs/operators';
import {Dispatch} from '@entities/dispatch';
import {CardListColorEnum} from '@common/components/card-list/card-list-color.enum';
import {MainHeaderService} from '@app/services/main-header.service';
import {IconConfig} from '@common/components/panel/model/icon-config';
import {ToastService} from '@app/services/toast.service';
import {BarcodeScannerModeEnum} from '@common/components/barcode-scanner/barcode-scanner-mode.enum';
import {Emplacement} from '@entities/emplacement';
import {Status} from '@entities/status';
import {SelectItemComponent} from '@common/components/select-item/select-item.component';
import {SelectItemTypeEnum} from '@common/components/select-item/select-item-type.enum';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {DispatchPack} from '@entities/dispatch-pack';
import {StorageService} from '@app/services/storage/storage.service';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {NetworkService} from '@app/services/network.service';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";

enum Page {
    LOCATION,
    STATUS
}

@Component({
    selector: 'wii-dispatch-validate',
    templateUrl: './dispatch-validate.page.html',
    styleUrls: ['./dispatch-validate.page.scss'],
})
export class DispatchValidatePage implements ViewWillEnter, ViewWillLeave {

    public currentPage: Page = Page.LOCATION;
    public readonly PageLocation: Page = Page.LOCATION;
    public readonly PageStatus: Page = Page.STATUS;

    public readonly selectItemLocation = SelectItemTypeEnum.LOCATION;
    public readonly barcodeScannerLocationMode = BarcodeScannerModeEnum.TOOL_SEARCH;

    public statusRequestParams: Array<string>;

    @ViewChild('locationSelectItemComponent', {static: false})
    public locationSelectItemComponent: SelectItemComponent;

    public loading: boolean;

    private loadingSubscription?: Subscription;
    private loadingElement?: HTMLIonLoadingElement;

    private afterValidate: () => void;

    public locationHeaderConfig: {
        title: string;
        subtitle?: string;
        leftIcon: IconConfig;
        transparent: boolean;
    };

    public statusHeaderConfig: {
        title: string;
        subtitle?: string;
        leftIcon: IconConfig;
        transparent: boolean;
    };

    public selectedLocation: Emplacement;
    public selectedStatus: Status;
    private dispatch: Dispatch;
    private dispatchPacks: Array<DispatchPack>;
    public statuses: Array<Status> = [];

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService,
                       private localDataManager: LocalDataManagerService,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       private networkService: NetworkService,
                       private navService: NavService) {
    }


    public ionViewWillEnter(): void {
        this.loading = true;
        this.unsubscribeLoading();
        const dispatchId = this.navService.param('dispatchId');
        this.dispatchPacks = this.navService.param('dispatchPacks') || [];
        const treatedDispatchPacks = this.dispatchPacks.filter(({treated, already_treated}) => (treated || already_treated));
        const partial = (treatedDispatchPacks.length < this.dispatchPacks.length);
        this.afterValidate = this.navService.param('afterValidate');

        this.statusRequestParams = [
            `state = '${partial ? 'partial' : 'treated'}'`,
            `category = 'acheminement'`,
        ];
        this.loadingSubscription = this.loadingService.presentLoading()
            .pipe(
                tap((loader) => {
                    this.loadingElement = loader;
                }),
                mergeMap(() => zip(
                    this.sqliteService.findOneBy('dispatch', {id: dispatchId}),
                    this.sqliteService.findBy('status', this.statusRequestParams)
                )),
                filter((dispatch) => Boolean(dispatch))
            )
            .subscribe(([dispatch, statuses]: [Dispatch, Array<any>]) => {
                this.dispatch = dispatch;

                this.statuses = statuses.filter((status) => status.typeId === this.dispatch.typeId);

                this.refreshLocationHeaderConfig();
                this.refreshStatusHeaderConfig();

                this.unsubscribeLoading();
                this.loading = false;

                this.locationSelectItemComponent.fireZebraScan();
            });
    }


    public ionViewWillLeave(): void {
        this.unsubscribeLoading();
        this.locationSelectItemComponent.unsubscribeZebraScan();
    }

    public selectLocation(location: Emplacement): void {
        if (this.dispatch.locationToLabel === location.label) {
            this.selectedLocation = location;
            this.refreshLocationHeaderConfig();
        }
        else {
            this.toastService.presentToast(`Erreur : l'emplacement de dépose doit être : ${this.dispatch.locationToLabel}.`);
        }
    }

    private unsubscribeLoading(): void {
        if (this.loadingSubscription) {
            this.loadingSubscription.unsubscribe();
            this.loadingSubscription = undefined;
        }
        if (this.loadingElement) {
            this.loadingElement.dismiss();
            this.loadingElement = undefined;
        }
    }

    private refreshLocationHeaderConfig(): void {
        this.locationHeaderConfig = {
            title: 'Emplacement sélectionné',
            subtitle: this.selectedLocation && this.selectedLocation.label,
            ...(this.createHeaderConfig())
        };
    }

    private refreshStatusHeaderConfig(): void {
        this.statusHeaderConfig = {
            title: 'Statut sélectionné',
            subtitle: this.selectedStatus && this.selectedStatus.label,
            ...(this.createHeaderConfig())
        };
    }

    private createHeaderConfig(): { leftIcon: IconConfig; transparent: boolean;} {
        return {
            transparent: true,
            leftIcon: {
                name: 'stock-transfer.svg',
                color: CardListColorEnum.GREEN,
                customColor: this.dispatch.color
            }
        };
    }

    public async validate() {
        if (this.currentPage === this.PageLocation) {
            if (this.selectedLocation) {
                this.currentPage = this.PageStatus;
                this.locationSelectItemComponent.unsubscribeZebraScan();
            }
            else {
                this.toastService.presentToast('Vous devez sélectionner un emplacement.');
            }
        }
        else { // (this.currentPage === this.PageStatus)
            if (this.selectedStatus) {
                const treatedDispatchPacks = this.dispatchPacks.filter(({treated, already_treated}) => (treated || already_treated));
                const hasNetwork = await this.networkService.hasNetwork();
                this.loadingSubscription = this.loadingService.presentLoading()
                    .pipe(
                        tap((loader) => {
                            this.loadingElement = loader;
                        }),
                        mergeMap(() => zip(
                            this.sqliteService.update(
                                'dispatch',
                                [{
                                    values: {
                                        treatedStatusId: this.selectedStatus.id,
                                        partial: Number(treatedDispatchPacks.length < this.dispatchPacks.length)
                                    },
                                    where: [`id = ${this.dispatch.id}`],
                                }]
                            ),
                            ...(treatedDispatchPacks
                                .map(({id, natureId, quantity, treated, photo1, photo2}) => this.sqliteService.update(
                                    'dispatch_pack',
                                    [{
                                        values: {natureId, quantity, treated, photo1, photo2},
                                        where: [`id = ${id}`]
                                    }]
                                )))
                        )),
                        mergeMap((): any => (
                            hasNetwork
                                ? this.localDataManager.sendFinishedProcess('dispatch')
                                : of({offline: true})
                        )),
                        mergeMap((res: any) => (
                            res.success
                                ? this.storageService.incrementCounter(StorageKeyEnum.COUNTERS_DISPATCHES_TREATED).pipe(map(() => res))
                                : of(res)
                        )),
                        mergeMap(({offline, success}) => {
                            if (!offline) {
                                this.toastService.presentToast(success ? "L'acheminement a bien été traité." : "L'acheminement n'a pas pu être traité.");
                            }
                            return this.navService.pop();
                        })
                    )
                    .subscribe(() => {
                        this.afterValidate();
                    })
            }
            else {
                this.toastService.presentToast('Vous devez sélectionner un statut.');
            }
        }
    }
}
