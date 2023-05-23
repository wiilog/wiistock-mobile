import {Component} from '@angular/core';
import {CardListConfig} from '@common/components/card-list/card-list-config';
import {Preparation} from '@entities/preparation';
import {CardListColorEnum} from '@common/components/card-list/card-list-color.enum';
import {NavService} from '@app/services/nav/nav.service';
import {MainHeaderService} from '@app/services/main-header.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import * as moment from "moment";
import {ViewWillEnter} from "@ionic/angular";
import {TranslationService} from "@app/services/translations.service";

@Component({
    selector: 'wii-preparation-menu',
    templateUrl: './preparation-menu.page.html',
    styleUrls: ['./preparation-menu.page.scss'],
})
export class PreparationMenuPage implements ViewWillEnter {
    public preparations: Array<Preparation>;

    public preparationsListConfig: Array<CardListConfig>;
    public readonly preparationsListColor = CardListColorEnum.BLUE;
    public readonly preparationsIconName = 'preparation.svg';

    public hasLoaded: boolean;
    public firstLaunch: boolean;

    public projetTrad: string;

    public constructor(private mainHeaderService: MainHeaderService,
                       private sqlLiteProvider: SqliteService,
                       private navService: NavService,
                       private translationService: TranslationService) {
        this.firstLaunch = true;

        this.translationService.get(null, `Référentiel`, `Projet`).subscribe((projetTranslations) => {
            this.projetTrad = TranslationService.Translate(projetTranslations, 'Projet');
        });
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;
        const withoutLoading = this.navService.param('withoutLoading');
        if (!this.firstLaunch || !withoutLoading) {
            this.sqlLiteProvider.findAll('preparation').subscribe((preparations) => {
                this.preparations = preparations
                    .filter(p => (p.date_end === null))
                    // sort in APi side too
                    .sort((a, b) => {
                        const momentExpectedDate1 = moment(a.expectedAt, 'DD/MM/YYYY HH:mm:ss');
                        const momentExpectedDate2 = moment(b.expectedAt, 'DD/MM/YYYY HH:mm:ss');
                        return (
                            (momentExpectedDate1.isValid() && !momentExpectedDate2.isValid()) || momentExpectedDate1.isBefore(momentExpectedDate2) ? -1 :
                                (!momentExpectedDate1.isValid() && momentExpectedDate2.isValid()) || momentExpectedDate1.isAfter(momentExpectedDate2) ? 1 :
                                    0
                        );
                    });

                this.preparationsListConfig = this.preparations.map((preparation: Preparation) => ({
                    title: {
                        label: 'Demandeur',
                        value: preparation.requester
                    },
                    customColor: preparation.color,
                    content: [
                        {
                            label: 'Numéro',
                            value: preparation.numero
                        },
                        {
                            label: 'Flux',
                            value: preparation.type
                        },
                        {
                            label: 'Destination',
                            value: preparation.destination
                        },
                        {
                            label: 'Commentaire',
                            value: preparation.comment
                        },
                        ...(
                            preparation.expectedAt
                                ? [{
                                    label: 'Date attendue',
                                    value: preparation.expectedAt
                                }]
                                : []
                        ),
                        ...(
                            preparation.project
                                ? [{
                                    label: this.projetTrad,
                                    value: preparation.project
                                }]
                                : []
                        )
                    ],
                    action: () => {
                        this.navService.push(NavPathEnum.PREPARATION_ARTICLES, {preparation});
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
        const preparationsLength = this.preparations.length;
        this.mainHeaderService.emitSubTitle(`${preparationsLength === 0 ? 'Aucune' : preparationsLength} préparation${preparationsLength > 1 ? 's' : ''}`)
    }
}
