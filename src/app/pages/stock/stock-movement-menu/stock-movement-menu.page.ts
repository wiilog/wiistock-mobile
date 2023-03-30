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
import {StorageService} from '@app/services/storage/storage.service';
import {NetworkService} from '@app/services/network.service';
import {ViewWillEnter} from "@ionic/angular";


@Component({
    selector: 'wii-stock-movement-menu',
    templateUrl: './stock-movement-menu.page.html',
    styleUrls: ['./stock-movement-menu.page.scss'],
})
export class StockMovementMenuPage implements ViewWillEnter, CanLeave {

    public nbDrop: number;
    public statsSlidersData: Array<StatsSlidersData>;
    public readonly menuConfig: Array<MenuConfig>;

    private canLeave: boolean;
    private deposeAlreadyNavigate: boolean;

    public constructor(private networkService: NetworkService,
                       private loadingService: LoadingService,
                       private sqliteService: SqliteService,
                       private activatedRoute: ActivatedRoute,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       private navService: NavService) {
        this.nbDrop = 0;
        this.statsSlidersData = this.createStatsSlidersData(this.nbDrop);
        this.canLeave = true;
        this.deposeAlreadyNavigate = false;

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
    }

    public wiiCanLeave(): boolean {
        return this.canLeave;
    }

    public ionViewWillEnter(): void {
        const goToDropDirectly = (!this.deposeAlreadyNavigate && Boolean(this.navService.param('goToDropDirectly')));
        this.canLeave = false;

        zip(
            this.loadingService.presentLoading(),
            this.sqliteService.findAll('mouvement_traca')
        )
            .subscribe(([loading, mouvementTraca]: [HTMLIonLoadingElement, Array<MouvementTraca>]) => {
                this.nbDrop = mouvementTraca
                    .filter(({finished, type, fromStock}) => (
                        type === 'prise' &&
                        !finished &&
                        fromStock
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

    public async goToPrise() {
        const hasNetwork = await this.networkService.hasNetwork();
        if (hasNetwork) {
            this.navService.push(NavPathEnum.EMPLACEMENT_SCAN, {
                fromDepose: false,
                fromStock: true,
                finishAction: () => this.navService.pop()
            });
        }
        else {
            this.toastService.presentToast('Vous devez être connecté à internet pour effectuer une prise');
        }
    }

    public async goToDrop() {
        const hasNetwork = await this.networkService.hasNetwork();
        if (hasNetwork) {
            if (this.canNavigateToDepose) {
                this.navService.push(NavPathEnum.EMPLACEMENT_SCAN, {
                    fromDepose: true,
                    fromStock: true,
                    finishAction: () => this.navService.pop()
                });
            }
            else {
                this.toastService.presentToast('Aucune prise n\'a été enregistrée');
            }
        }
        else {
            this.toastService.presentToast('Vous devez être connecté à internet pour effectuer une dépose');
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
