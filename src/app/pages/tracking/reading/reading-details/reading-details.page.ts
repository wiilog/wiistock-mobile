import {Component} from '@angular/core';
import {NavService} from '@app/services/nav/nav.service';
import {ViewWillEnter} from '@ionic/angular';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {Translations} from '@entities/translation';
import {TranslationService} from '@app/services/translations.service';
import {zip} from 'rxjs';
import {IconConfig} from "@common/components/panel/model/icon-config";
import {CardListConfig} from "@common/components/card-list/card-list-config";
import {move} from "ionicons/icons";

@Component({
    selector: 'wii-reading-details',
    templateUrl: './reading-details.page.html',
    styleUrls: ['./reading-details.page.scss'],
})
export class ReadingDetailsPage implements ViewWillEnter {

    public pack: {code: string; creatingOperationNumber: string; ref_emplacement: string; date: string;};
    public types: {[id: number]: string};

    public values: {
        logisticUnit: {
            code: string,
            nature: string,
            location: string,
            date: string,
            quantity: string,
        },
        movements: Array<{
            type: string;
            date: string;
            location: string;
            nature?: string;
            operator: string;
            comment?: string;
            quantity?: string;
        }>
        references: Array<{reference: string; label: string; emergency?: boolean; typeId: number}>,
        types: {[id: number]: string},
        orderNumbers: string,
        suppliers: string,
        creatingDispatch?: string,
        inProgressDispatch?: string,
        creatingOperationNumber?: string,
        trackingDelayData?: {
            color?: string;
            delay?: string;
            limitTreatmentDate?: string;
        },
    };

    public dispatchTranslations: Translations
    public natureTranslations: Translations

    public headerConfig: {
        leftIcon: IconConfig;
        title: string;
    };

    public contentConfig: Array<{
        label: string,
        value?: {
            text: string|number,
            bold?: boolean,
            underline?: boolean,
            color?: string,
            action?: () => void,
        },
    }>;

    public movementsListConfig: Array<CardListConfig>;

    public constructor(private navService: NavService, private translationService: TranslationService) {
    }

    public ionViewWillEnter(): void {
        this.values = this.navService.param(`values`);

        zip(
            this.translationService.get(`Demande`, `Acheminements`, `Champs fixes`),
            this.translationService.get(null, `Traçabilité`, `Général`)
        ).subscribe(([dispatchTranslations, natureTranslations]: [Translations, Translations]) => {
            this.dispatchTranslations = dispatchTranslations;
            this.natureTranslations = natureTranslations;

            this.refreshHeaderConfig();
            this.refreshContentConfig();
            this.refreshMovementsList();
        });
    }

    public redirectToCreatingDispatch(): void {
        if (this.values
            && this.values.logisticUnit.code
            && this.values.creatingDispatch
            && !this.values.inProgressDispatch
            && this.values.creatingDispatch === this.values.creatingOperationNumber) {
            this.navService.setRoot(NavPathEnum.MAIN_MENU, {
                dispatchNumber: this.values.creatingDispatch
            });
        }
    }

    public redirectToInProgressDispatch(): void {
        if (this.values.inProgressDispatch) {
            this.navService.setRoot(NavPathEnum.MAIN_MENU, {
                dispatchNumber: this.values.inProgressDispatch
            });
        }
    }

    private refreshHeaderConfig(): void {
        this.headerConfig = {
            title: `Unité logistique ${this.values.logisticUnit.code}`,
            leftIcon: {
                name: `reading.svg`,
            }
        };
    }

    private refreshContentConfig(): void {
        const inProgressDispatch = this.values.inProgressDispatch;
        const creatingDispatch = this.values.creatingDispatch;
        const trackingDelayData = this.values.trackingDelayData;

        this.contentConfig = [
            {
                label: TranslationService.Translate(this.natureTranslations, `Nature`),
                value: {
                    text: this.values.logisticUnit.nature,
                    bold: true,
                },
            },
            {
              label: `Quantité`,
              value: {
                  text: this.values.logisticUnit.quantity,
                  bold: true,
              },
            },
            {
                label: `Dernier emplacement`,
                value: {
                    text: this.values.logisticUnit.location,
                    bold: true,
                }
            },
            {
                label: `À`,
                value: {
                    text: this.values.logisticUnit.date,
                    bold: true,
                }
            },
            {
                label: TranslationService.Translate(this.dispatchTranslations, `Numéro de commande`),
                value: {
                    text: this.values.orderNumbers,
                    bold: true,
                }
            },
            {
                label: `Fournisseur(s)`,
                value: {
                    text: this.values.suppliers,
                    bold: true,
                }
            },
            ...(trackingDelayData && trackingDelayData.delay
                ? [{
                    label: `Délai traitement restant`,
                    value: {
                        text: trackingDelayData.delay,
                        bold: true,
                        color: trackingDelayData.color,
                    }
                }]
                : []),
            ...(trackingDelayData && trackingDelayData.limitTreatmentDate
                ? [{
                    label: `Date limite de traitement`,
                    value: {
                        text: trackingDelayData.limitTreatmentDate,
                        bold: true,
                    }
                }]
                : []),
            ...(inProgressDispatch && creatingDispatch !== inProgressDispatch)
                ? [{
                    label: `Issu de`,
                    value: {
                        text: inProgressDispatch,
                        bold: true,
                        underline: true,
                        color: `#5260ff`,
                        action: () => this.redirectToCreatingDispatch(),
                    },
                }] : [],
            ...inProgressDispatch
                ? [{
                    label: `${TranslationService.Translate(this.dispatchTranslations, `Acheminement`)} en cours`,
                    value: {
                        text: inProgressDispatch,
                        bold: true,
                        underline: true,
                        color: `#5260ff`,
                        action: () => this.redirectToInProgressDispatch(),
                    },
                }] : [],
        ].filter((item) => item && item.value?.text);
    }

    public refreshMovementsList() {
        this.movementsListConfig = this.values.movements
            .map((movement) => ({
                customColor: '#0842B7',
                title: {
                    label: movement.type,
                    value: movement.date,
                },
                content: [
                    {
                        label: 'Emplacement',
                        value: movement.location,
                    },
                    {
                        label: 'Nature',
                        value: movement.nature,
                    },
                    {
                        label: 'Opérateur',
                        value: movement.operator,
                    },
                    {
                        label: 'Commentaire',
                        value: movement.comment,
                    },
                    {
                        label: 'Quantité',
                        value: movement.quantity,
                    },
                ].filter((item) => item && item.value),
            }));
    }

    public back() {
        this.navService.pop();
    }
}
