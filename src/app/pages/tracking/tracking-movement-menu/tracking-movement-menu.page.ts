import {Component} from '@angular/core';
import {LoadingService} from '@app/services/loading.service';
import {ToastService} from '@app/services/toast.service';
import {zip} from 'rxjs';
import {MenuConfig} from '@common/components/menu/menu-config';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {MouvementTraca} from '@entities/mouvement-traca';
import {StatsSlidersData} from '@common/components/stats-sliders/stats-sliders-data';
import {NavService} from '@app/services/nav/nav.service';
import {ActivatedRoute} from '@angular/router';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {StorageService} from '@app/services/storage/storage.service';
import {ViewWillEnter} from "@ionic/angular";
import {NetworkService} from "@app/services/network.service";


@Component({
    selector: 'wii-tracking-movement-menu',
    templateUrl: './tracking-movement-menu.page.html',
    styleUrls: ['./tracking-movement-menu.page.scss'],
})
export class TrackingMovementMenuPage implements ViewWillEnter, CanLeave {

    public nbDrop: number = 0;
    public statsSlidersData: Array<StatsSlidersData>;
    public menuConfig: Array<MenuConfig> = [];

    private canLeave: boolean = true;
    private deposeAlreadyNavigate: boolean = false;

    public constructor(private loadingService: LoadingService,
                       private sqliteService: SqliteService,
                       private activatedRoute: ActivatedRoute,
                       private toastService: ToastService,
                       private networkService: NetworkService,
                       private storageService: StorageService,
                       private navService: NavService) {
        this.statsSlidersData = this.createStatsSlidersData(this.nbDrop);
    }

    public wiiCanLeave(): boolean {
        return this.canLeave;
    }

    public ionViewWillEnter(): void {
        const goToDropDirectly = (!this.deposeAlreadyNavigate && Boolean(this.navService.param('goToDropDirectly')));
        this.canLeave = false;

        zip(
            this.loadingService.presentLoading(),
            this.sqliteService.findAll('mouvement_traca'),
            this.storageService.getRight(StorageKeyEnum.RIGHT_EMPTY_ROUND),
            this.storageService.getRight(StorageKeyEnum.RIGHT_RECEIPT_ASSOCIATION),
        )
            .subscribe(([loading, mouvementTraca, emptyRound, receiptAssociation]: [HTMLIonLoadingElement, Array<MouvementTraca>, boolean, boolean]) => {
                this.menuConfig = [
                    {
                        icon: 'upload.svg',
                        label: 'Prise',
                        action: () => this.goToPrise()
                    },
                    {
                        icon: 'download.svg',
                        label: 'Dépose',
                        action: () => this.goToDrop()
                    }
                ];

                if(emptyRound) {
                    this.menuConfig.push({
                        icon: 'empty-round.svg',
                        label: 'Passage à vide',
                        action: () => {
                            this.navService.push(NavPathEnum.EMPLACEMENT_SCAN, {fromEmptyRound: true});
                        }
                    });
                }

                if (receiptAssociation) {
                    this.menuConfig.push({
                        icon: 'receipt-association.svg',
                        label: 'Association',
                        action: async () => {
                            const hasNetwork = await this.networkService.hasNetwork();
                            if (!hasNetwork) {
                                this.toastService.presentToast(NetworkService.DEFAULT_HAS_NETWORK_MESSAGE);
                                return;
                            }

                            this.navService.push(NavPathEnum.RECEIPT_ASSOCIATION_MENU);
                        }
                    });
                }

                this.nbDrop = mouvementTraca
                    .filter(({finished, type, fromStock, packGroup}) => (
                        type === 'prise' &&
                        !finished &&
                        !fromStock && !packGroup
                    ))
                    .length;

                this.statsSlidersData = this.createStatsSlidersData(this.nbDrop);
                loading.dismiss();
                this.canLeave = true;

                if (goToDropDirectly) {
                    this.deposeAlreadyNavigate = true;
                    this.goToDrop();
                }
            });
    }

    public goToPrise(): void {
        this.navService.push(NavPathEnum.EMPLACEMENT_SCAN, {
            fromDepose: false,
            fromStock: false
        });
    }

    public goToDrop(): void {
        if (this.canNavigateToDepose) {
            this.navService.push(NavPathEnum.EMPLACEMENT_SCAN, {
                fromDepose: true,
                fromStock: false
            });
        }
        else {
            this.toastService.presentToast('Aucune prise n\'a été enregistrée');
        }
    }

    private get canNavigateToDepose(): boolean {
        return this.nbDrop > 0;
    }

    private createStatsSlidersData(nbDrop: number): Array<StatsSlidersData> {
        const sNbDrop = nbDrop > 1 ? 's' : '';
        return [
            { label: `Produit${sNbDrop} en prise`, counter: nbDrop, danger: nbDrop > 0 }
        ]
    }
}
