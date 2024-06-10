import {Component} from '@angular/core';
import {ViewWillEnter} from "@ionic/angular";
import {CardListConfig} from "@common/components/card-list/card-list-config";
import {CardListColorEnum} from "@common/components/card-list/card-list-color.enum";
import * as moment from 'moment';
import {ApiService} from "@app/services/api.service";

@Component({
    selector: 'wii-reception-menu',
    templateUrl: './reception-menu.page.html',
    styleUrls: ['./reception-menu.page.scss'],
})
export class ReceptionMenuPage implements ViewWillEnter {
    public hasLoaded: boolean;

    public receptionsListConfig: Array<CardListConfig>;
    public readonly receptionsListColor = CardListColorEnum.PINK;
    public readonly receptionsIconName = 'reception.svg';


    public constructor(private apiService: ApiService) {}

    public ionViewWillEnter(): void {
        this.hasLoaded = false;
        this
            .apiService.requestApi(ApiService.GET_RECEPTIONS, {})
            .subscribe({
                next: (response: { success: any; data: { expectedDate: string; }[]; }) => {
                    if (response.success){
                        this.receptionsListConfig = response.data
                            .sort((a: { expectedDate: string; }, b: { expectedDate: string; }) => moment(a.expectedDate).diff(moment(b.expectedDate)))
                            .map((reception: any ) => ({
                                title: {
                                    label: 'Réception',
                                    value: reception.number
                                },
                                content: [
                                    ...(reception.status
                                        ? [
                                            {
                                                label: 'Statut',
                                                value:reception.status
                                            }
                                        ]
                                        : []),
                                    ...(reception.supplier
                                        ? [
                                            {
                                                label: 'Fournisseur',
                                                value:reception.supplier
                                            }
                                        ]
                                        : []),
                                    ...(reception.orderNumber && reception.orderNumber.length > 0
                                        ? [
                                            {
                                                label: 'Numéro de commande',
                                                value: reception.orderNumber?.join(', ')
                                            }
                                        ]
                                        : []),
                                    ...(reception.expectedDate
                                        ? [
                                            {
                                                label: 'Date attendue',
                                                value: moment(reception.expectedDate).format('DD/MM/YYYY')
                                            }
                                        ]
                                        : []),
                                    ...(reception.user
                                        ? [
                                            {
                                                label: 'Utilisateur',
                                                value: reception.user
                                            }
                                        ]
                                        : []),
                                    ...(reception.carrier
                                        ? [
                                            {
                                                label: 'Transporteur',
                                                value: reception.carrier
                                            }
                                        ]
                                        : []),
                                    ...(reception.location
                                        ? [
                                            {
                                                label: 'Emplacement',
                                                value: reception.location
                                            }
                                        ]
                                        : []),
                                ],
                                ...(reception.emergency
                                    ? {
                                        rightIcon: {
                                            name: 'exclamation-triangle.svg',
                                            color: 'danger'
                                        }
                                    }
                                    : {}),
                                action: () => {
                            }
                        }));
                    }
                },
                complete: () => {
                    this.hasLoaded = true;
                }
            });
    }
}
