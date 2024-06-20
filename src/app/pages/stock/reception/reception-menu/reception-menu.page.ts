import {Component} from '@angular/core';
import {ViewWillEnter} from "@ionic/angular";
import {CardListConfig} from "@common/components/card-list/card-list-config";
import {CardListColorEnum} from "@common/components/card-list/card-list-color.enum";
import * as moment from 'moment';
import {ApiService} from "@app/services/api.service";
import {MainHeaderService} from "@app/services/main-header.service";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";
import {NavService} from "@app/services/nav/nav.service";

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


    public constructor(private apiService: ApiService,
                       private navService: NavService,
                       private mainHeaderService: MainHeaderService) {}


    public ionViewWillEnter(): void {
        this.hasLoaded = false;
        this
            .apiService.requestApi(ApiService.GET_RECEPTIONS, {})
            .subscribe({
                next: (response: { success: any; data: { expectedDate: {date: string; }; }[]; }) => {
                    if (response.success){
                        this.receptionsListConfig = response.data
                            .sort((a: { expectedDate: { date: string; }; }, b: { expectedDate: { date: string; }; }) => moment(a.expectedDate?.date, 'YYYY-MM-DD HH:mm:ss.SSSSSS').diff(moment(b.expectedDate?.date, 'YYYY-MM-DD HH:mm:ss.SSSSSS')))
                            .map((reception: any ) => {
                                const content: Array<{ label: string; value: string; }> = [
                                    {
                                        label: 'Statut',
                                        value: reception.status
                                    },
                                    {
                                        label: 'Fournisseur',
                                        value: reception.supplier
                                    },
                                    {
                                        label: 'Numéro de commande',
                                        value: reception.orderNumber?.join(', ')
                                    },
                                    {
                                        label: 'Date attendue',
                                        value: reception.expectedDate
                                            ? moment(reception.expectedDate.date, 'YYYY-MM-DD HH:mm:ss.SSSSSS').format('DD/MM/YYYY')
                                            : '',
                                    },
                                    {
                                        label: 'Utilisateur',
                                        value: reception.user
                                    },
                                    {
                                        label: 'Transporteur',
                                        value: reception.carrier
                                    },
                                    {
                                        label: 'Emplacement',
                                        value: reception.location
                                    },
                                    {
                                        label: 'Emplacement de stockage',
                                        value: reception.storageLocation
                                    }
                                ].filter((item) => item && item.value);
                                return ({
                                    title: {
                                        label: 'Réception',
                                        value: reception.number
                                    },
                                    content: content,
                                    ...(reception.emergency
                                        ? {
                                            rightIcon: {
                                                name: 'exclamation-triangle.svg',
                                                color: 'danger'
                                            }
                                        }
                                        : {}),
                                    action: () => {
                                        this.navService.push(NavPathEnum.RECEPTION_DETAILS, {
                                            reception,
                                            content,
                                        })
                                    }
                                });
                            });
                    }
                },
                complete: () => {
                    this.hasLoaded = true;
                    const receptionsLength: number = this.receptionsListConfig.length;
                    this.mainHeaderService.emitSubTitle(`${receptionsLength === 0 ? 'Aucune' : receptionsLength} Reception${receptionsLength > 1 ? 's' : ''}`);
                }
            });
    }
}
