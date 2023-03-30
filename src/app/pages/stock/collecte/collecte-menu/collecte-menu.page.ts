import {Component} from '@angular/core';
import {Collecte} from '@entities/collecte';
import {CardListConfig} from '@common/components/card-list/card-list-config';
import {CardListColorEnum} from '@common/components/card-list/card-list-color.enum';
import {MainHeaderService} from '@app/services/main-header.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {NavService} from '@app/services/nav/nav.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {ViewWillEnter} from "@ionic/angular";


@Component({
    selector: 'wii-collecte-menu',
    templateUrl: './collecte-menu.page.html',
    styleUrls: ['./collecte-menu.page.scss'],
})
export class CollecteMenuPage implements ViewWillEnter {
    public hasLoaded: boolean;

    public collectes: Array<Collecte>;

    public collectesListConfig: Array<CardListConfig>;
    public readonly collectesListColor = CardListColorEnum.ORANGE;
    public readonly collectesIconName = 'collect.svg';

    private goToDrop: () => void;
    private avoidSync: () => void;

    private firstLaunch: boolean;

    public constructor(private mainHeaderService: MainHeaderService,
                       private sqliteService: SqliteService,
                       private navService: NavService) {
        this.firstLaunch = true;
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;
        this.goToDrop = this.navService.param('goToDrop');
        this.avoidSync = this.navService.param('avoidSync');

        const withoutLoading = this.navService.param('withoutLoading');
        if (!this.firstLaunch || !withoutLoading) {
            this.sqliteService.findAll('collecte').subscribe((collectes: Array<Collecte>) => {
                this.collectes = collectes
                    .filter(({date_end, location_to}) => (!date_end && !location_to))
                    .sort(({location_from: location_from_1}, {location_from: location_from_2}) => ((location_from_1 < location_from_2) ? -1 : 1));

                this.collectesListConfig = this.collectes.map((collecte: Collecte) => ({
                    title: {
                        label: 'Demandeur',
                        value: collecte.requester
                    },
                    content: [
                        {
                            label: 'Numéro',
                            value: collecte.number
                        },
                        {
                            label: 'Flux',
                            value: collecte.type
                        },
                        {
                            label: 'Point de collecte',
                            value: collecte.location_from
                        },
                        {
                            label: 'Destination',
                            value: (collecte.forStock ? 'Mise en stock' : 'Destruction')
                        }
                    ],
                    action: () => {
                        this.navService.push(NavPathEnum.COLLECTE_ARTICLES, {
                            collecte,
                            goToDrop: () => {
                                this.avoidSync();
                                this.navService.pop().subscribe(() => {
                                    this.goToDrop();
                                });
                            }
                        });
                    }
                }));

                this.hasLoaded = true;
                this.refreshSubTitle();
            });
        }
        else {
            this.hasLoaded = true;
            this.firstLaunch = false;
        }
    }

    public refreshSubTitle(): void {
        const collectesLength = this.collectes.length;
        this.mainHeaderService.emitSubTitle(`${collectesLength === 0 ? 'Aucune' : collectesLength} collecte${collectesLength > 1 ? 's' : ''}`)
    }
}
