import {Component} from '@angular/core';
import {NavService} from '@app/services/nav/nav.service';
import {DemandeLivraisonArticle} from '@entities/demande-livraison-article';
import {ToastService} from '@app/services/toast.service';
import {ViewWillEnter} from "@ionic/angular";


@Component({
    selector: 'wii-demande-livraison-article-take',
    templateUrl: './demande-livraison-article-take.page.html',
    styleUrls: ['./demande-livraison-article-take.page.scss'],
})
export class DemandeLivraisonArticleTakePage implements ViewWillEnter {

    public simpleFormConfig: {
        title: string;
        info: Array<{label: string; value: string;}>
        fields: Array<{label: string; name: string; type: string; value?: string|number;}>
    };

    private article: DemandeLivraisonArticle;
    private addArticleInDemande: (article: DemandeLivraisonArticle) => void;

    public constructor(private toastService: ToastService,
                       private navService: NavService) {
    }

    public ionViewWillEnter(): void {
        this.article = this.navService.param('article');
        this.addArticleInDemande = this.navService.param('addArticleInDemande');

        this.simpleFormConfig = {
            title: 'Confirmation quantité',
            info: [
                {label: 'Référence', value: this.article.reference},
                {
                    label: 'Gestion',
                    value: (
                        this.article.type_quantity === 'reference' ? 'Par référence' :
                        this.article.type_quantity === 'article' ? 'Par article' :
                        this.article.type_quantity
                    )
                },
                {label: 'Code barre', value: this.article.barcode},
                {label: 'Quantité disponible', value: this.article.available_quantity ? String(this.article.available_quantity) : '-'}
            ],
            fields: [
                {
                    label: 'Quantité souhaitée',
                    name: 'quantity',
                    type: 'number',
                    value: this.article.quantity_to_pick || undefined
                }
            ]
        }
    }

    public addArticle({quantity}: any): void {
        if (!quantity || !Number(quantity) || quantity <= 0) {
            this.toastService.presentToast('Veuillez sélectionner une quantité valide.');
        }
        else {
            this.addArticleInDemande({
                ...this.article,
                quantity_to_pick: quantity
            });
            this.navService.pop();
        }
    }
}
