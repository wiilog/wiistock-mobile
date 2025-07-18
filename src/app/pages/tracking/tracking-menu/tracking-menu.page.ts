import {Component} from '@angular/core';
import {MenuConfig} from '@common/components/menu/menu-config';
import {ViewWillEnter} from '@ionic/angular';
import {MainHeaderService} from '@app/services/main-header.service';
import {ToastService} from '@app/services/toast.service';
import {NavService} from '@app/services/nav/nav.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {StorageService} from "@app/services/storage/storage.service";
import {zip} from "rxjs";
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {StatsSlidersData} from '@common/components/stats-sliders/stats-sliders-data';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {TranslationService} from '@app/services/translations.service';
import {NetworkService} from '@app/services/network.service';

@Component({
    selector: 'wii-tracking-menu',
    templateUrl: './tracking-menu.page.html',
    styleUrls: ['./tracking-menu.page.scss'],
})
export class TrackingMenuPage implements ViewWillEnter {

    public menuConfig: Array<MenuConfig> = [];
    public statsSlidersData: Array<StatsSlidersData>;

    public constructor(private mainHeaderService: MainHeaderService,
                       private networkService: NetworkService,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       private sqliteService: SqliteService,
                       private translationService: TranslationService,
                       private navService: NavService) {
    }

    public ionViewWillEnter(): void {
        this.mainHeaderService.emitSubTitle('');
        this.menuConfig = [];
        zip(
            this.storageService.getRight(StorageKeyEnum.TRUCK_ARRIVAL),
            this.storageService.getRight(StorageKeyEnum.FORCE_GROUPED_SIGNATURE),
            this.storageService.getRight(StorageKeyEnum.DISPATCH_OFFLINE_MODE),
            this.storageService.getRight(StorageKeyEnum.RIGHT_MOVEMENT),
            this.storageService.getRight(StorageKeyEnum.RIGHT_DISPATCH),
            this.storageService.getRight(StorageKeyEnum.RIGHT_READING_MENU),
            this.storageService.getCounter(StorageKeyEnum.COUNTERS_DISPATCHES_TREATED),
            this.sqliteService.count('dispatch', ['treatedStatusId IS NULL OR partial = 1']),

            this.translationService.get(`Demande`, `Acheminements`, `Général`)
        ).subscribe(
            ([truckArrival, forceSignature, dispatchOfflineMode, movement, dispatch, readingMenu, treatedDispatches, toTreatDispatches, translations]) => {
                if (!dispatchOfflineMode && dispatch) {
                    this.menuConfig.push(
                        {
                            icon: 'stock-transfer.svg',
                            label: TranslationService.Translate(translations, 'Acheminements'),
                            action: () => {
                                if (forceSignature) {
                                    this.navService.push(NavPathEnum.DISPATCH_GROUPED_SIGNATURE);
                                } else {
                                    this.navService.push(NavPathEnum.DISPATCH_MENU);
                                }
                            }
                        }
                    );
                }
                if(movement){
                    this.menuConfig.push(
                        {
                            icon: 'tracking.svg',
                            label: 'Mouvements',
                            action: () => {
                                this.navService.push(NavPathEnum.TRACKING_MOVEMENT_MENU);
                            }
                        },
                    );
                }
                if(truckArrival){
                    this.menuConfig.push({
                        icon: 'arrivage-camion.svg',
                        label: 'Arrivage camion',
                        action: () => {
                            this.navService.push(NavPathEnum.TRUCK_ARRIVAL_CARRIER);
                        }
                    },)
                }

                if(readingMenu) {
                    this.menuConfig.push({
                        icon: 'reading.svg',
                        label: 'Lecture',
                        action: async() => {
                            const hasNetwork = await this.networkService.hasNetwork();
                            if(hasNetwork) {
                                this.navService.push(NavPathEnum.READING_SCAN);
                            } else {
                                this.toastService.presentToast('Une connexion internet est requise pour accéder à cette fonctionnalité.')
                            }
                        }
                    });
                }

                this.statsSlidersData = this.createStatsSlidersData(treatedDispatches, toTreatDispatches);
            }
        );
    }

    private createStatsSlidersData(treatedDispatchesCounter: number, toTreatedDispatchesCounter: number): Array<StatsSlidersData> {
        const sTreatedDispatches = treatedDispatchesCounter > 1 ? 's' : '';
        const sToTreatedDispatches = toTreatedDispatchesCounter > 1 ? 's' : '';
        return [
            { label: `Acheminement${sToTreatedDispatches} à traiter`, counter: toTreatedDispatchesCounter },
            { label: `Acheminement${sTreatedDispatches} traité${sTreatedDispatches}`, counter: treatedDispatchesCounter }
        ];
    }
}
