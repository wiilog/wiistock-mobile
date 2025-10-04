import {Component} from '@angular/core';
import {NavService} from '@app/services/nav/nav.service';
import {ViewWillEnter} from '@ionic/angular';
import {ArticleLivraison} from "@database/article-livraison";
import {IconConfig} from "@common/components/panel/model/icon-config";
import {ListPanelItemConfig} from "@common/components/panel/model/list-panel/list-panel-item-config";
import {ArticlePrepa} from "@database/article-prepa";

@Component({
    selector: 'wii-delivery-logistic-unit-content',
    templateUrl: './delivery-logistic-unit-content.page.html',
    styleUrls: ['./delivery-logistic-unit-content.page.scss'],
})
export class DeliveryLogisticUnitContentPage implements ViewWillEnter {

    public articles: Array<ArticleLivraison|ArticlePrepa>;
    public logisticUnit: string;
    public listBoldValues?: Array<string> = ['label', 'barcode', 'location', 'quantity', 'reference'];

    public logisticUnitHeaderConfig?: {
        leftIcon: IconConfig;
        title: string;
        subtitle?: string;
    };

    public articlesConfig?: {
        body: Array<ListPanelItemConfig>;
    };

    public extraArticles: Array<any> = [];

    private callback: (articles: any) => void;

    public constructor(private navService: NavService) {
    }

    public ionViewWillEnter(): void {
        this.articles = this.navService.param(`articles`);
        this.logisticUnit = this.navService.param(`logisticUnit`);
        this.extraArticles = this.navService.param(`extraArticles`) || [];
        this.callback = this.navService.param('callback');

        this.articles = this.articles.concat(this.extraArticles);
        this.logisticUnitHeaderConfig = {
            leftIcon: {
                name: `logistic-unit.svg`
            },
            title: `Contenu unité logistique`,
            subtitle: this.logisticUnit
        }

        this.refreshArticlesConfig();
    }

    public refreshArticlesConfig(): void {
        this.articlesConfig = {
            body: this.articles
                .map((article: any) => ({
                    infos: {
                        ...(article.label ? ({
                            label: {
                                label: 'Libellé',
                                value: article.label
                            }
                        }) : {}),
                        barcode: {
                            label: `Code barre`,
                            value: article.barcode
                        },
                        ...(article.location || article.emplacement ? ({
                            location: {
                                label: `Emplacement`,
                                value: `location` in article ? article.location : article.emplacement
                            }
                        }) : {}),
                        quantity: {
                            label: `Quantité`,
                            value: `${'quantity' in article ? article.quantity : article.quantite}`
                        },
                        ...(article.reference ? ({
                            reference: {
                                label: 'Référence',
                                value: article.reference
                            }
                        }) : {})
                    },
                    selected: article.selected || false,
                }))
                .sort((article) => article.selected ? -1 : 1)
        }
    }

    public back() {
        this.navService.pop().subscribe(() => {
            this.callback(this.extraArticles);
        })
    }
}
