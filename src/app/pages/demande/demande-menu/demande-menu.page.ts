import {Component} from '@angular/core';
import {MenuConfig} from '@common/components/menu/menu-config';
import {merge, Subscription, zip} from 'rxjs';
import {NavService} from '@app/services/nav/nav.service';
import {Platform, ViewWillEnter, ViewWillLeave} from '@ionic/angular';
import {MainHeaderService} from '@app/services/main-header.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {ToastService} from '@app/services/toast.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {StatsSlidersData} from '@common/components/stats-sliders/stats-sliders-data';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {StorageService} from '@app/services/storage/storage.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {NetworkService} from '@app/services/network.service';


@Component({
    selector: 'wii-demande-menu',
    templateUrl: './demande-menu.page.html',
    styleUrls: ['./demande-menu.page.scss'],
})
export class DemandeMenuPage implements ViewWillEnter, ViewWillLeave {

    public readonly menuConfig: Array<MenuConfig>;
    public statsSlidersData: Array<StatsSlidersData>;

    public messageLoading?: string;
    public loading: boolean;
    public dispatchOfflineMode: boolean;

    private avoidSync: boolean;
    private synchronisationSubscription?: Subscription;
    private navigationSubscription?: Subscription;

    public constructor(private platform: Platform,
                       private mainHeaderService: MainHeaderService,
                       private localDataManager: LocalDataManagerService,
                       private networkService: NetworkService,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       private sqliteService: SqliteService,
                       private navService: NavService) {
        this.avoidSync = true;
        const self = this;
    }

    public ionViewWillEnter(): void {
        this.navigationSubscription = merge(
            this.mainHeaderService.navigationChange$,
            this.platform.backButton
        )
            .subscribe(() => {
                this.setAvoidSync(true);
            });

        if (!this.avoidSync) {
            this.synchronise();
        }
        else {
            this.setAvoidSync(false);
        }

        zip(
            this.storageService.getCounter(StorageKeyEnum.COUNTERS_HANDLINGS_TREATED),
            this.storageService.getRight(StorageKeyEnum.DISPATCH_OFFLINE_MODE),
            this.storageService.getRight(StorageKeyEnum.RIGHT_HANDLING),
            this.storageService.getRight(StorageKeyEnum.RIGHT_DISPATCH),
            this.storageService.getRight(StorageKeyEnum.RIGHT_DELIVERY_REQUEST),
            this.sqliteService.count('handling')
        ).subscribe(
            ([treatedHandlings, dispatchOfflineMode, handling, dispatch, deliveryRequest, toTreatDispatches]) => {
                this.statsSlidersData = this.createStatsSlidersData(treatedHandlings, toTreatDispatches);
                this.dispatchOfflineMode = dispatchOfflineMode;
                if(handling){
                    this.menuConfig.push({
                        icon: 'people.svg',
                        label: 'Service',
                        action: () => {
                            this.navService.push(NavPathEnum.HANDLING_MENU);
                        }
                    })
                }
                if(dispatch){
                    this.menuConfig.push({
                        icon: 'demande.svg',
                        iconColor: 'list-yellow',
                        label: 'Livraison',
                        action: () => {
                            this.navService.push(NavPathEnum.DEMANDE_LIVRAISON_MENU);
                        }
                    });
                }
                if(deliveryRequest){
                    this.menuConfig.push({
                        icon: 'transfer.svg',
                        iconColor: 'success',
                        label: 'Acheminement',
                        action: () => {
                            this.navService.push(NavPathEnum.DISPATCH_REQUEST_MENU, {dispatchOfflineMode: this.dispatchOfflineMode});
                        }
                    });
                }
            }
        )
    }

    public ionViewWillLeave(): void {
        if (this.synchronisationSubscription) {
            this.synchronisationSubscription.unsubscribe();
            this.synchronisationSubscription = undefined;
        }
        if (this.navigationSubscription) {
            this.navigationSubscription.unsubscribe();
            this.navigationSubscription = undefined;
        }
    }

    public async synchronise() {
        const hasNetwork = await this.networkService.hasNetwork();
        if (hasNetwork) {
            this.loading = true;

            this.synchronisationSubscription = this.localDataManager.synchroniseData().subscribe({
                next: ({finished, message}) => {
                    this.messageLoading = message;
                    this.loading = !finished;
                },
                error: (error) => {
                    const {api, message} = error;
                    this.loading = false;
                    if (api && message) {
                        this.toastService.presentToast(message);
                    }
                    throw error;
                }
            });
        }
        else {
            this.loading = false;
            this.toastService.presentToast('Veuillez vous connecter à internet afin de synchroniser vos données');
        }
    }

    public setAvoidSync(avoidSync: boolean) {
        this.avoidSync = avoidSync;
    }

    private createStatsSlidersData(treatedHandlingsCounter: number,
                                   toTreatedHandlingsCounter: number): Array<StatsSlidersData> {
        const sTreatedHandlings = treatedHandlingsCounter > 1 ? 's' : '';
        const sToTreatedHandlings = toTreatedHandlingsCounter > 1 ? 's' : '';
        return [
            { label: `Service${sToTreatedHandlings} à traiter`, counter: toTreatedHandlingsCounter },
            { label: `Service${sTreatedHandlings} traité${sTreatedHandlings}`, counter: treatedHandlingsCounter }
        ];
    }
}
