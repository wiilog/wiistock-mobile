import {Component} from '@angular/core';
import {CardListConfig} from '@common/components/card-list/card-list-config';
import {CardListColorEnum} from '@common/components/card-list/card-list-color.enum';
import {MainHeaderService} from '@app/services/main-header.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {NavService} from '@app/services/nav/nav.service';
import {TransferOrder} from '@entities/transfer-order';
import {Subscription, zip} from 'rxjs';
import {LoadingService} from '@app/services/loading.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {TransferOrderArticle} from '@entities/transfer-order-article';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {StorageService} from '@app/services/storage/storage.service';
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";


@Component({
    selector: 'wii-transfer-list',
    templateUrl: './transfer-list.page.html',
    styleUrls: ['./transfer-list.page.scss'],
})
export class TransferListPage implements ViewWillEnter, ViewWillLeave {
    public hasLoaded: boolean;

    public transfersListConfig: Array<CardListConfig>;
    public readonly transfersListColor = CardListColorEnum.TERTIARY;
    public readonly transfersIconName = 'transfer.svg';

    private loadingSubscription?: Subscription;
    private loader?: HTMLIonLoadingElement;

    private firstLaunch: boolean;

    public constructor(private mainHeaderService: MainHeaderService,
                       private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private navService: NavService,
                       private storageService: StorageService) {
        this.firstLaunch = true;
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;
        this.unsubscribeLoading();

        const withoutLoading = this.navService.param('withoutLoading');

        if (!this.firstLaunch || !withoutLoading) {
            this.loadingSubscription = zip(
                this.loadingService.presentLoading(),
                this.sqliteService.findBy('transfer_order', ['treated <> 1']),
                this.sqliteService.findAll('transfer_order_article'),
                this.storageService.getRight(StorageKeyEnum.PARAMETER_DISPLAY_REFERENCES_ON_TRANSFER_CARDS),
            )
                .subscribe(([loader, transferOrders, transferOrderArticles, displayReferencesOnCard]: [HTMLIonLoadingElement, Array<TransferOrder>, Array<TransferOrderArticle>, boolean]) => {
                    this.loader = loader;
                    this.transfersListConfig = transferOrders.map((transferOrder: TransferOrder) => ({
                        title: {
                            label: 'Demandeur',
                            value: transferOrder.requester
                        },
                        content: [
                            {
                                label: 'Numéro',
                                value: transferOrder.number
                            },
                            {
                                label: 'Origine',
                                value: transferOrder.origin
                            },
                            {
                                label: 'Destination',
                                value: transferOrder.destination
                            },
                        ],
                        table: displayReferencesOnCard ? {
                            title: 'Références contenues',
                            values: transferOrderArticles
                                .filter((transferOrderArticle: TransferOrderArticle) => transferOrderArticle.transfer_order_id === transferOrder.id)
                                .map((transferOrderArticle: TransferOrderArticle) => transferOrderArticle.label)
                                .filter((value, index, array) => array.indexOf(value) === index)
                        } : undefined as any,
                        action: () => {
                            this.navService.push(NavPathEnum.TRANSFER_ARTICLES, {transferOrder});
                        }
                    }));

                    this.hasLoaded = true;
                    const transferOrdersLength = transferOrders.length;
                    this.mainHeaderService.emitSubTitle(`${transferOrdersLength === 0 ? 'Aucun' : transferOrdersLength} transfert${transferOrdersLength > 1 ? 's' : ''}`);

                    this.unsubscribeLoading();
                });
        }
        else {
            this.hasLoaded = true;
            this.firstLaunch = false;
        }
    }

    public ionViewWillLeave(): void {
        this.unsubscribeLoading();
    }

    private unsubscribeLoading(): void {
        if (this.loadingSubscription) {
            this.loadingSubscription.unsubscribe();
            this.loadingSubscription = undefined;
        }

        if (this.loader) {
            this.loader.dismiss();
            this.loader = undefined;
        }
    }
}
