import {Component} from '@angular/core';
import {mergeMap, Subscription, zip} from 'rxjs';
import {NavService} from '@app/services/nav/nav.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {LoadingService} from '@app/services/loading.service';
import {tap} from 'rxjs/operators';
import {Dispatch} from '@entities/dispatch';
import {CardListColorEnum} from '@common/components/card-list/card-list-color.enum';
import {MainHeaderService} from '@app/services/main-header.service';
import {IconConfig} from '@common/components/panel/model/icon-config';
import {ToastService} from '@app/services/toast.service';
import {Status} from '@entities/status';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {StorageService} from '@app/services/storage/storage.service';
import {NetworkService} from '@app/services/network.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";

@Component({
    selector: 'wii-dispatch-grouped-signature-validate',
    templateUrl: './dispatch-grouped-signature-validate.page.html',
    styleUrls: ['./dispatch-grouped-signature-validate.page.scss'],
})
export class DispatchGroupedSignatureValidatePage implements ViewWillEnter, ViewWillLeave {

    public statusRequestParams: Array<string>;

    public loading: boolean;

    private loadingSubscription?: Subscription;
    private loadingElement?: HTMLIonLoadingElement;

    private afterValidate: () => void;

    public statusHeaderConfig: {
        title: string;
        subtitle?: string;
        leftIcon: IconConfig;
        transparent: boolean;
    };

    public selectedStatus: Status;
    public type: number;
    public status: number;
    private dispatchs?: Array<Dispatch>;
    public statuses: Array<Status> = [];
    public from?: {
        id: number,
        text: string
    };
    public to?: {
        id: number,
        text: string
    };

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
        this.afterValidate = this.navService.param('afterValidate');
        this.dispatchs = this.navService.param('dispatchesToSign');
        this.from = this.navService.param('from');
        this.to = this.navService.param('to');
        this.type = this.navService.param('type');
        this.status = this.navService.param('status');

        let groupedSignatureType = '';

        if(this.from && this.to){
            groupedSignatureType = '!= \'\'';
        } else if (this.from){
            groupedSignatureType = "= 'Enlèvement'";
        } else if (this.to){
            groupedSignatureType = "= 'Livraison'";
        } else {
            this.toastService.presentToast("Une erreur s'est produite lors de la sélection des demandes.");
        }

        this.statusRequestParams = [
            `state = 'treated' OR state = 'partial'`,
            `category = 'acheminement'`,
            `typeId = ${this.type}`,
            `id != ${this.status}`,
            `groupedSignatureType ${groupedSignatureType}`
        ];
        this.loadingSubscription = this.loadingService.presentLoading()
            .pipe(
                tap((loader) => {
                    this.loadingElement = loader;
                }),
                mergeMap(() => zip(
                    this.sqliteService.findBy('status', this.statusRequestParams, {displayOrder: 'ASC'})
                )),
            )
            .subscribe(([statuses]: [Array<any>]) => {
                this.statuses = statuses;
                this.refreshStatusHeaderConfig();

                this.unsubscribeLoading();
                this.loading = false;
            });

    }


    public ionViewWillLeave(): void {
        this.unsubscribeLoading();
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
            }
        };
    }

    public validate() {
        if (this.selectedStatus) {
            this.navService.push(NavPathEnum.DISPATCH_GROUPED_SIGNATURE_FINISH, {
                dispatches: this.dispatchs,
                status: this.selectedStatus,
                to: this.to,
                from: this.from,
            })
        } else {
            this.toastService.presentToast('Vous devez sélectionner un statut.');
        }
    }
}
