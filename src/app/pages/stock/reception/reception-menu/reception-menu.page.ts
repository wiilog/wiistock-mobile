import {Component} from '@angular/core';
import {ViewWillEnter} from "@ionic/angular";
import {CardListConfig} from "@common/components/card-list/card-list-config";
import {CardListColorEnum} from "@common/components/card-list/card-list-color.enum";
import * as moment from 'moment';
import {ApiService} from "@app/services/api.service";
import {MainHeaderService} from "@app/services/main-header.service";
import {NavPathEnum} from "@app/services/nav/nav-path.enum";
import {NavService} from "@app/services/nav/nav.service";
import {LoadingService} from "@app/services/loading.service";
import {Reception} from "@entities/reception";
import {ReceptionService} from "@app/services/reception.service";
import {Livraison} from "@entities/livraison";

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
                       private receptionService: ReceptionService,
                       private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService) {}


    public ionViewWillEnter(): void {
        this.hasLoaded = false;

        this.loadingService.presentLoadingWhile({
            event: () => this.apiService.requestApi(ApiService.GET_RECEPTIONS)
        })
            .subscribe({
                next: (response: { success: boolean; data: Array<Reception>; }) => {
                    this.hasLoaded = true;
                    if (response.success){
                        this.updateViewList(response.data);

                        const receptionsLength: number = this.receptionsListConfig.length;
                        this.mainHeaderService.emitSubTitle(`${receptionsLength === 0 ? 'Aucune' : receptionsLength} réception${receptionsLength > 1 ? 's' : ''}`);
                    }
                },
                error: () => {
                    this.hasLoaded = true;
                    this.updateViewList([]);
                }
            });
    }

    public updateViewList(receptions: Array<Reception>) {
        this.receptionsListConfig = receptions
            .sort((reception1, reception2) => (
                moment(reception1.expectedDate?.date, 'YYYY-MM-DD HH:mm:ss.SSSSSS').diff(
                    moment(reception2.expectedDate?.date, 'YYYY-MM-DD HH:mm:ss.SSSSSS')
                )
            ))
            .map((reception: any ) => {
                const serializedReception = this.receptionService.serializeReception(reception);
                const content = Object.entries(serializedReception)
                    .filter(([key, item]) => (
                        ['status', 'supplier', 'orderNumber', 'expectedDate', 'user', 'carrier', 'location', 'storageLocation'].includes(key)
                        && item?.value
                    ))
                    .map(([_, item]) => item);
                return ({
                    title: {
                        label: 'Réception',
                        value: reception.number
                    },
                    content,
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
                        })
                    }
                });
            });

        const length = receptions.length;
        this.mainHeaderService.emitSubTitle(`${length === 0 ? 'Aucune' : length} réception${length > 1 ? 's' : ''}`)
    }
}
